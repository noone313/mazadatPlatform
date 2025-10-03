import { Auction, AuctionImage,Bid, Category,User } from "../models/models.js";
import { test_request_values } from "./user.controller.js";
import { scheduleAuction } from "../utils/closeAuctions.js";



export async function createAuction(req, res) {
  try {
    console.log('🎯 createAuction function started');
    console.log('📦 Request body:', req.body);
    console.log('📁 Uploaded file:', req.file);

    // التحقق من الصورة
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        message: "الصورة مطلوبة للمزاد"
      });
    }

    const { title, description, start_price, end_time, categoryName } = req.body;

    // باقي التحقق من الحقول
    if (!title || !description || !start_price || !end_time || !categoryName) {
      // حذف الصورة إذا تم رفعها وفشل التحقق
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة"
      });
    }

    // باقي الكود...
    const category = await Category.findOne({ where: { name: categoryName } });
    if (!category) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: `الفئة "${categoryName}" غير موجودة`
      });
    }

    // إنشاء المزاد
    const auction = await Auction.create({
      title,
      description,
      start_price,
      current_price: start_price,
      start_time: new Date(),
      end_time: new Date(end_time),
      status: "active",
      seller_id: req.user.id,
      category_id: category.category_id
    });

    // حفظ الصورة
    const auctionImage = await AuctionImage.create({
      image_url: req.file.path,
      auction_id: auction.auction_id
    });

    const createdAuction = await Auction.findByPk(auction.auction_id, { 
      include: AuctionImage 
    });

    scheduleAuction(auction);

    return res.status(201).json({
      success: true,
      message: "تم إنشاء المزاد بنجاح",
      data: createdAuction
    });

  } catch (error) {
    // حذف الصورة إذا كانت موجودة
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error("Error creating auction:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message
    });
  }
}




export async function getAuction(req, res) {
  try {
    const user = req.user || null;
    const { id } = req.params;

    // البحث عن المزاد مع الصور والمزايدات والفئة والبائع
    const auction = await Auction.findByPk(id, {
      include: [
        {
          model: AuctionImage,
          attributes: ["image_id", "image_url"]
        },
        {
          model: Bid,
          attributes: ["bid_id", "amount", "bid_time", "bidder_id"],
          order: [["amount", "DESC"]],
          include: [
            {
              model: User,
              as: "Bidder",
              attributes: ["user_id", "full_name", "email"]
            }
          ]
        },
        {
          model: Category,
          attributes: ["category_id", "name", "description"]
        },
        {
          model: User,
          as: "Seller",
          attributes: ["user_id", "full_name", "email"]
        }
      ]
    });

    if (!auction) {
      return res.status(404).render("error", {
        success: false,
        message: "المزاد غير موجود",
        missingFields: []
      });
    }

    return res.status(200).render("auctiondetails", {
      success: true,
      auction,
      user
    });

  } catch (error) {
    console.error(error);
    return res.status(500).render("error", {
      success: false,
      message: "حدث خطأ في السيرفر",
      missingFields: [],
      error: error.message
    });
  }
};


export async function deleteAuction(req, res) {
  try {
    const { id } = req.params;

    const auction = await Auction.findByPk(id);
    if (!auction) {
      return res.status(404).render("error", {
        success: false,
        message: "المزاد غير موجود",
        missingFields: []
      });
    }

    await auction.destroy();

    return res.status(200).render("success", {
      success: true,
      message: "تم حذف المزاد بنجاح",
      data: auction // يمكنك إرسال بيانات المزاد المحذوف إذا أحببت
    });

  } catch (error) {
    console.error(error);
    return res.status(500).render("error", {
      success: false,
      message: "حدث خطأ في السيرفر",
      missingFields: [],
      error: error.message
    });
  }
}




export async function updateAuction(req, res) {
  try {
    const { id } = req.params;
    const { title, description, start_price, end_time, categoryName } = req.body;

    // التحقق من القيم المطلوبة
    const check = test_request_values(title, description, start_price, end_time, categoryName);
    if (!check.success) {
      return res.status(400).render("error", {
        success: false,
        message: "جميع الحقول مطلوبة",
        missingFields: check.errors || []
      });
    }

    const category = await Category.findOne({ where: { name: categoryName } });
    if (!category) {
      return res.status(404).render("error", {
        success: false,
        message: `الفئة "${categoryName}" غير موجودة`,
        missingFields: []
      });
    }

    const auction = await Auction.findByPk(id);
    if (!auction) {
      return res.status(404).render("error", {
        success: false,
        message: "المزاد غير موجود",
        missingFields: []
      });
    }

    // تحديث بيانات المزاد
    auction.title = title;
    auction.description = description;
    auction.start_price = start_price;
    auction.current_price = start_price;
    auction.end_time = new Date(end_time);
    auction.category_id = category.category_id;

    await auction.save();

    return res.status(200).render("success", {
      success: true,
      message: "تم تحديث المزاد بنجاح",
      data: auction
    });

  } catch (error) {
    console.error(error);
    return res.status(500).render("error", {
      success: false,
      message: "حدث خطأ في السيرفر",
      missingFields: [],
      error: error.message
    });
  }
}


export async function getAllAuctions(req, res) {
  try {
    const user = req.user || null;
    // باراميترات البيجنيشن
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: auctions } = await Auction.findAndCountAll({
      include: [
        {
          model: AuctionImage,
          attributes: ["image_id", "image_url"]
        },
        {
          model: Category,
          attributes: ["category_id", "name", "description"]
        },
        {
          model: User,
          as: "Seller",
          attributes: ["user_id", "full_name", "email"]
        },
        {
          model: Bid,
          attributes: ["bid_id"],
          separate: true // لجلب عدد المزايدات
        }
      ],
      where: {
        status: 'active' // فقط المزادات النشطة
      },
      order: [["created_at", "DESC"]],
      limit,
      offset
    });

    // جلب الإحصائيات الحقيقية
    const totalActiveAuctions = await Auction.count({ where: { status: 'active' } });
    const totalUsers = await User.count();
    const totalEndedAuctions = await Auction.count({ where: { status: 'closed' } });
    
    // حساب قيمة المبيعات (مجموع أسعار المزادات المنتهية)
    const totalSales = await Auction.sum('current_price', { 
      where: { status: 'closed' } 
    }) || 0;

    return res.status(200).render("auctions", {
      success: true,
      page,
      totalPages: Math.ceil(count / limit),
      totalAuctions: count,
      auctions: auctions.map(auction => ({
        ...auction.toJSON(),
        bids_count: auction.Bids ? auction.Bids.length : 0,
        main_image: auction.AuctionImages && auction.AuctionImages.length > 0 
          ? auction.AuctionImages[0].image_url 
          : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        time_left: calculateTimeLeft(auction.end_time)
      })),
      user,
      stats: {
        activeAuctions: totalActiveAuctions,
        totalUsers: totalUsers,
        endedAuctions: totalEndedAuctions,
        totalSales: totalSales
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).render("error", {
      success: false,
      message: "حدث خطأ في السيرفر",
      missingFields: [],
      error: error.message
    });
  }
}

// دالة مساعدة لحساب الوقت المتبقي
function calculateTimeLeft(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;

  if (diff <= 0) {
    return '00:00:00';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
