import express from "express";
import {
  createReview,
  deleteReview,
  getProductReviews,
  updateReview,
} from "../controllers/reviewController.js";
import auth from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { reviewSchema } from "../schemas/apiSchemas.js";

const reviewRouter = express.Router();

reviewRouter.get("/product/:productId", getProductReviews);
reviewRouter.post("/", auth, validateBody(reviewSchema), createReview);
reviewRouter.put("/:id", auth, validateBody(reviewSchema.partial()), updateReview);
reviewRouter.delete("/:id", auth, deleteReview);

export default reviewRouter;
