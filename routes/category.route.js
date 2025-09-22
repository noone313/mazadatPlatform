import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
} from "../controllers/category.controller.js";
       
import { authenticateToken } from "../middlewares/auth.js";

const categoryRouter = Router();

// كل العمليات محمية بواسطة JWT
categoryRouter.post("/category", authenticateToken, createCategory);
categoryRouter.get("/category", getAllCategories);
categoryRouter.put("/category/:id", authenticateToken, updateCategory);
categoryRouter.delete("/category/:id", authenticateToken, deleteCategory);

export { categoryRouter };
