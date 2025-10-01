import { Auction, AuctionImage,Bid, Category,User } from "../models/models.js";
import { test_request_values } from "./user.controller.js";
import { scheduleAuction } from "../utils/closeAuctions.js";



export async function createAuction(req, res) {
  try {
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

    // التأكد من أن المستخدم بائع
    if (req.user.role !== "seller") {
      return res.status(403).render("error", {
        success: false,
        message: "غير مسموح لك بإنشاء مزاد، يجب أن تكون بائع",
        missingFields: []
      });
    }

    // التحقق من الوقت النهائي للمزاد
    if (new Date(end_time) <= new Date()) {
      return res.status(400).render("error", {
        success: false,
        message: "وقت الانتهاء يجب أن يكون مستقبلي",
        missingFields: []
      });
    }

    // التحقق من السعر الابتدائي
    if (start_price <= 0) {
      return res.status(400).render("error", {
        success: false,
        message: "السعر الابتدائي يجب أن يكون أكبر من صفر",
        missingFields: []
      });
    }

    // التأكد من وجود صورة واحدة
    if (!req.file) {
      return res.status(400).render("error", {
        success: false,
        message: "الصورة مطلوبة",
        missingFields: []
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

    // حفظ الصورة في جدول AuctionImage
    const auctionImage = await AuctionImage.create({
      image_url: req.file.path,
      auction_id: auction.auction_id
    });

    // جلب المزاد مع الصورة لإرسال الاستجابة
    const createdAuction = await Auction.findByPk(auction.auction_id, { include: AuctionImage });

    // جدولة المزاد (إذا لديك وظيفة scheduleAuction)
    scheduleAuction(auction);

    return res.status(201).render("success", {
      success: true,
      message: "تم إنشاء المزاد بنجاح",
      data: createdAuction
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




export async function getAuction(req, res) {
  try {
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
      auction
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
        }
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset
    });

    return res.status(200).render("auctions", {
      success: true,
      page,
      totalPages: Math.ceil(count / limit),
      totalAuctions: count,
      auctions
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


export async function getAllAuctionsWithFilter(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // الفلاتر
    const { category_id, status } = req.query;
    const where = {};
    if (category_id) where.category_id = category_id;
    if (status) where.status = status; // "active", "closed", "cancelled"

    const { count, rows: auctions } = await Auction.findAndCountAll({
      where,
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
        }
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset
    });

    return res.status(200).render("auctions", {
      success: true,
      page,
      totalPages: Math.ceil(count / limit),
      totalAuctions: count,
      auctions,
      filters: { category_id, status }
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

