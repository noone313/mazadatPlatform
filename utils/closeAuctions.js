import { Auction, Notification, sequelize } from "../models/models.js";

export async function closeAuction(auctionId) {
  const t = await sequelize.transaction(); // فتح ترانساكشن

  try {
    // جلب المزاد بقفل (FOR UPDATE) يمنع التعديل من أكثر من عملية بنفس الوقت
    const auction = await Auction.findOne({
      where: { auction_id: auctionId },
      lock: true,
      transaction: t
    });

    if (!auction || auction.status !== "active") {
      await t.rollback();
      return;
    }

    auction.status = "closed";
    await auction.save({ transaction: t });

    // مثال: إرسال إشعار للفائز (آخر مزايد)
    const lastBid = await auction.getBids({
      limit: 1,
      order: [["amount", "DESC"]],
      transaction: t
    });

    if (lastBid.length > 0) {
      const winnerId = lastBid[0].bidder_id;
      const successNotification = await Notification.create({
        user_id: winnerId,
        message: `🎉 مبروك! ربحت المزاد ${auction.auction_id} بمبلغ ${lastBid[0].amount}`
      }, { transaction: t });

      // بث الإشعار عبر سوكيت للفائز
      global.io?.to(`user_${winnerId}`).emit("notification", successNotification);
    }

    await t.commit(); // إنهاء الترانساكشن بنجاح

    console.log(`✅ تم إغلاق المزاد ${auction.auction_id}`);
    global.io?.to(`auction_${auction.auction_id}`).emit("auctionClosed", {
      auction_id: auction.auction_id,
      message: "المزاد انتهى وتم إغلاقه."
    });

  } catch (error) {
    await t.rollback(); // إرجاع كل شيء لو صار خطأ
    console.error("❌ خطأ في إغلاق المزاد:", error);
  }
}


// دالة جدولة مزاد واحد
export function scheduleAuction(auction) {
  const now = new Date();
  const end = new Date(auction.end_time);
  const delay = end.getTime() - now.getTime();

  if (delay > 0) {
    console.log(`⏳ جدولة إغلاق المزاد ${auction.auction_id} بعد ${delay / 1000} ثانية`);
    setTimeout(() => closeAuction(auction.auction_id), delay);
  } else {
    // إذا انتهى بالفعل
    closeAuction(auction.auction_id);
  }
}

// عند تشغيل السيرفر: نعمل جدولة لكل المزادات النشطة
export async function initAuctionScheduler() {
  const activeAuctions = await Auction.findAll({
    where: { status: "active" }
  });

  for (const auction of activeAuctions) {
    scheduleAuction(auction);
  }
}
