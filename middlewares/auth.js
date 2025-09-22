import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const token = req.cookies?.token; // قراءة الكوكي باسم "token"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "غير مصرح لك، الرجاء تسجيل الدخول"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // حفظ بيانات المستخدم في request
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "توكن غير صالح أو منتهي الصلاحية"
    });
  }
}
