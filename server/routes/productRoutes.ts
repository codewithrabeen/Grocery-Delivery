import express from "express";
import {
  createProduct,
  deleteProduct,
  getFlashDeals,
  getFrequentlyBoughtTogether,
  getNewArrivals,
  getPopularProducts,
  getProduct,
  getProducts,
  getRelatedProducts,
  getTrendingProducts,
  updateProduct,
} from "../controllers/productController.js";
import admin from "../middleware/admin.js";
import auth from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { productQuerySchema, productSchema, productUpdateSchema } from "../schemas/apiSchemas.js";

const productRouter = express.Router();

productRouter.get("/flash-deals", getFlashDeals);
productRouter.get("/trending", getTrendingProducts);
productRouter.get("/new-arrivals", getNewArrivals);
productRouter.get("/popular", getPopularProducts);
productRouter.get("/", validateQuery(productQuerySchema), getProducts);
productRouter.get("/:id/related", getRelatedProducts);
productRouter.get("/:id/frequently-bought-together", getFrequentlyBoughtTogether);
productRouter.get("/:id", getProduct);
productRouter.post("/", auth, admin, validateBody(productSchema), createProduct);
productRouter.put("/:id", auth, admin, validateBody(productUpdateSchema), updateProduct);
productRouter.delete("/:id", auth, admin, deleteProduct);

export default productRouter;
