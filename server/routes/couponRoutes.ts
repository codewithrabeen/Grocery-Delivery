import express from "express";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  validateCoupon,
} from "../controllers/couponController.js";
import admin from "../middleware/admin.js";
import auth from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { couponSchema, couponValidateSchema } from "../schemas/apiSchemas.js";

const couponRouter = express.Router();

couponRouter.post("/validate", auth, validateBody(couponValidateSchema), validateCoupon);
couponRouter.get("/", auth, admin, listCoupons);
couponRouter.post("/", auth, admin, validateBody(couponSchema), createCoupon);
couponRouter.put("/:id", auth, admin, validateBody(couponSchema.partial()), updateCoupon);
couponRouter.delete("/:id", auth, admin, deleteCoupon);

export default couponRouter;
