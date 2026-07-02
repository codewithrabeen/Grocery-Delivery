import express from "express";
import { addWishlistItem, deleteWishlistItem, getWishlist } from "../controllers/wishlistController.js";
import auth from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { wishlistSchema } from "../schemas/apiSchemas.js";

const wishlistRouter = express.Router();

wishlistRouter.get("/", auth, getWishlist);
wishlistRouter.post("/", auth, validateBody(wishlistSchema), addWishlistItem);
wishlistRouter.delete("/:productId", auth, deleteWishlistItem);

export default wishlistRouter;
