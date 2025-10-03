import multer from "multer";
import path from "path";
import fs from "fs";

// مجلد التخزين
const uploadDir = "uploads/";

// إنشاء المجلد إذا لم يكن موجودًا
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✅ تم إنشاء مجلد: ${uploadDir}`);
}

// إعداد multer بسيط ومباشر
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('فقط ملفات الصور مسموح بها!'), false);
  }
};

// تصدير multer middleware مباشرة
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: fileFilter
});

export default upload;