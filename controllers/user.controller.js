import { User } from "../models/models.js";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
config();
import jwt from "jsonwebtoken";

export function test_request_values(...vals) {
  const errors = vals
    .map((val, i) => (val === undefined || val === null || val === "" ? `param_${i + 1} مفقود` : null))
    .filter(Boolean);

  return {
    success: errors.length === 0,
    errors,
    values: vals,
  };
}

export async function register(req, res) {
  try {
    const { full_name, email, password, address, phone, confirm_password, role } = req.body;

    // التحقق من القيم المطلوبة
    const check = test_request_values(full_name, email, password, address, phone, confirm_password, role);

    if (!check.success) {
      return res.status(400).render("error", {
        success: false,
        message: "جميع الحقول مطلوبة",
        missingFields: check.errors || []
      });
    }

    // التحقق من تطابق كلمات المرور
    if (password !== confirm_password) {
      return res.status(400).render('error', {
        success: false,
        message: "كلمتا المرور غير متطابقتان",
        missingFields: [] // لازم موجود حتى لو فاضي
      });
    }

    // التحقق من الدور
    if (!["buyer", "seller"].includes(role)) {
      return res.status(400).render('error', {
        success: false,
        message: "الدور غير صالح",
        missingFields: []
      });
    }

    // التحقق من وجود المستخدم مسبقاً
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).render('error', {
        success: false,
        message: "الايميل مسجل مسبقاً",
        missingFields: [] // هنا مو حقول ناقصة، بس نخليها موجودة
      });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم
    user = await User.create({
      full_name,
      email,
      password_hash: hashedPassword,
      address,
      phone,
      role
    });

    // إرسال استجابة النجاح
    return res.redirect('/login?registered=success');

  } catch (error) {
    console.error(error);
    return res.status(500).render('error', {
      success: false,
      message: "حدث خطأ في السيرفر",
      missingFields: [], // نفس الشي
      error: error.message
    });
  }
}



export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // التحقق من القيم المطلوبة
    const check = test_request_values(email, password);
    if (!check.success) {
      return res.status(400).render('login', {
        error: "جميع الحقول مطلوبة",
        missingFields: check.errors || []
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).render('login', { 
        error: "الايميل غير مسجل", 
        missingFields: [] 
      });
    }

    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.redirect('/login?error=invalid');
    }

    // إنشاء JWT وحفظه في الكوكي
    const token = jwt.sign(
      {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        address: user.address,
        phone: user.phone,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.redirect('/auctions');

  } catch (error) {
    console.error(error);
    return res.status(500).render("error", {
      success: false,
      message: "حدث خطأ في السيرفر",
      missingFields: [] // لازم تكون فاضية لأن هذا خطأ سيرفر
    });
  }
}



export async function update_my_account(req, res) {
  try {
    // التأكد من تسجيل الدخول
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).render('error',{
        success: false,
        message: "غير مصرح لك"
      });
    }

    // قراءة الحقول المرسلة للتحديث
    const { full_name, email, phone, address, password } = req.body;

    // البحث عن المستخدم
    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).render('error',{
        success: false,
        message: "المستخدم غير موجود"
      });
    }

    // تحديث الحقول إذا تم إرسالها
    if (full_name) user.full_name = full_name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    // تحديث كلمة المرور إذا تم إرسالها
    if (password) {
      const bcrypt = await import("bcryptjs");
      user.password_hash = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "تم تحديث الحساب بنجاح",
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message
    });
  }
}


export async function delete_my_account(req, res) {
  try {
    // التأكد أن المستخدم مسجل دخول عبر middleware JWT
    const userId = req.user?.id; 
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "غير مصرح لك"
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود"
      });
    }

    // حذف المستخدم
    await user.destroy();

    // مسح التوكن من الكوكي (اختياري)
    res.clearCookie("token");

    // إرسال الاستجابة
    return res.status(200).json({
      success: true,
      message: "تم حذف الحساب بنجاح"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message
    });
  }
}