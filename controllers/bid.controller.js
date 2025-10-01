import { Bid } from "../models/bid.model.js";
import { Auction } from "../models/auction.model.js";
import { Notification } from "../models/notification.model.js";
import { User, sequelize } from "../models/models.js";

export const createBid = async (req, res) => {
  const t = await sequelize.transaction(); // بدء الترانزاكشن
  try {
    const { auction_id, amount } = req.body;
    const bidder_id = req.user.id;

    // التحقق من أن المبلغ صالح
    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "المبلغ غير صالح" 
      });
    }

    // جلب المزاد مع قفل لتجنب التعارض (FOR UPDATE)
    const auction = await Auction.findByPk(auction_id, {
      include: [{
        model: Bid,
        as: "Bids",
        separate: true,
        order: [["amount", "DESC"]],
      }],
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!auction) {
      await t.rollback();
      return res.status(404).json({ 
        success: false,
        message: "المزاد غير موجود"
      });
    }

    if (auction.status !== "active") {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "المزاد غير نشط" 
      });
    }

    // أعلى مزايدة حالياً
    const highestBid = auction.Bids.length > 0 
      ? parseFloat(auction.Bids[0].amount) 
      : parseFloat(auction.start_price);

    if (bidAmount <= highestBid) {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: `المزايدة يجب أن تكون أعلى من المبلغ الحالي ${highestBid}` 
      });
    }

    // إنشاء المزايدة الجديدة
    const newBid = await Bid.create({ auction_id, bidder_id, amount: bidAmount }, { transaction: t });

    // تحديث السعر الحالي للمزاد
    auction.current_price = bidAmount;
    await auction.save({ transaction: t });

    await t.commit(); // إنهاء الترانزاكشن بنجاح

    // إشعار المزايد السابق بعد commit (لتقليل مدة القفل)
    if (auction.Bids.length > 0) {
      const previousHighestBidderId = auction.Bids[0].bidder_id;
      if (previousHighestBidderId !== bidder_id) {
        const notification = await Notification.create({
          user_id: previousHighestBidderId,
          message: `تم تخطي مزايدتك على المزاد ${auction_id}. أعلى مزايدة حالياً ${bidAmount}.`
        });

        global.io?.to(`user_${previousHighestBidderId}`).emit("notification", notification);
      }
    }

    // جلب المزايدة الجديدة مع بيانات المستخدم
    const populatedBid = await Bid.findByPk(newBid.bid_id, {
      include: [{ model: User, as: "Bidder", attributes: ["user_id", "full_name"] }]
    });

    // بث المزايدة الجديدة لجميع المتصلين بالمزاد
    global.io?.to(`auction_${auction_id}`).emit("newBid", {
      auction_id,
      current_price: auction.current_price,
      bid: populatedBid
    });

    // إرسال الاستجابة
    return res.status(201).json({
      success: true,
      message: "تم إنشاء المزايدة بنجاح",
      bid: populatedBid,
      current_price: auction.current_price
    });

  } catch (error) {
    await t.rollback(); // التراجع عند الخطأ
    console.error("❌ خطأ في إنشاء المزايدة:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message
    });
  }
};




// export async function remove_bid(req, res) {
//   const t = await sequelize.transaction(); // فتح ترانساكشن

//   try {
//     const { bid_id } = req.body;
//     const user_id = req.user.id;

//     const bid = await Bid.findByPk(bid_id, { transaction: t });
//     if (!bid) {
//       await t.rollback();
//       return res.status(404).json({ message: "المزايدة غير موجودة" });
//     }
//     if (bid.bidder_id !== user_id) {
//       await t.rollback();
//       return res.status(403).json({ message: "ليس لديك صلاحية لحذف هذه المزايدة" });
//     }

//     // جلب المزاد المرتبط قبل الحذف
//     const auction = await Auction.findByPk(bid.auction_id, {
//       include: [{ model: Bid, as: "Bids", order: [["amount", "DESC"]] }],
//       transaction: t
//     });

//     await bid.destroy({ transaction: t });

//     // إعادة حساب السعر الحالي للمزاد
//     let newCurrentPrice = auction.start_price;
//     if (auction.Bids.length > 1) {
//       // بعد حذف المزايدة هناك مزايدات أخرى
//       const highestBid = auction.Bids
//         .filter(b => b.bid_id !== bid.bid_id)
//         .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))[0];
//       newCurrentPrice = highestBid.amount;
//     }
//     auction.current_price = newCurrentPrice;
//     await auction.save({ transaction: t });

//     await t.commit();

//     // إرسال التحديث لجميع المتصلين بالمزاد
//     global.io?.to(`auction_${auction.auction_id}`).emit("bidRemoved", {
//       auction_id: auction.auction_id,
//       current_price: auction.current_price,
//       removed_bid_id: bid.bid_id
//     });

//     return res.status(200).json({
//       success: true,
//       message: "تم حذف المزايدة بنجاح",
//       current_price: auction.current_price
//     });

//   } catch (error) {
//     await t.rollback();
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "حدث خطأ في السيرفر",
//       error: error.message
//     });
//   }
// }



