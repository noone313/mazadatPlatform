import { Category } from "../models/models.js";

// إنشاء فئة جديدة
export async function createCategory(req, res) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "اسم الفئة مطلوب"
      });
    }

    const category = await Category.create({ name, description });

    return res.status(201).json({
      success: true,
      message: "تم إنشاء الفئة بنجاح",
      category
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

// عرض جميع الفئات
export async function getAllCategories(req, res) {
  try {
    const categories = await Category.findAll();
    return res.status(200).json({
      success: true,
      categories
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



// تحديث فئة
export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "الفئة غير موجودة"
      });
    }

    category.name = name || category.name;
    category.description = description || category.description;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "تم تحديث الفئة بنجاح",
      category
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

// حذف فئة
export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "الفئة غير موجودة"
      });
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: "تم حذف الفئة بنجاح"
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
