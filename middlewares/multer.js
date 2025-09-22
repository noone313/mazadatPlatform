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

// إعداد التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${name}${ext}`);
  },
});

// فلتر الملفات المسموح بها (صور فقط)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error("❌ الملف غير مسموح به. يسمح فقط بصور JPEG, PNG, GIF."));
  }
};

// إعداد multer
export const uploadAuctionImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // الحد الأقصى 2MB
  fileFilter
}).single("image"); // رفع صورة واحدة فقط
