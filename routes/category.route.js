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
categoryRouter.post("/categories", authenticateToken, createCategory);
categoryRouter.get("/categories", getAllCategories);
categoryRouter.put("/categories/:id", authenticateToken, updateCategory);
categoryRouter.delete("/categories/:id", authenticateToken, deleteCategory);

export { categoryRouter };
