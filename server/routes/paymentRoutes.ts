import express from "express";
import { z } from "zod";
import {
  esewaFailure,
  esewaRedirect,
  esewaSuccess,
  getPaymentMethods,
  getPaymentTransactions,
  khaltiCallback,
  verifyEsewa,
  verifyKhalti,
  verifyStripe,
} from "../controllers/paymentController.js";
import auth from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const paymentRouter = express.Router();

const stripeVerifySchema = z.object({
  orderId: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
});

const khaltiVerifySchema = z.object({
  orderId: z.string().trim().min(1),
  pidx: z.string().trim().min(1),
});

const esewaVerifySchema = z.object({
  transactionUuid: z.string().trim().min(1),
  data: z.string().trim().optional(),
});

paymentRouter.get("/methods", getPaymentMethods);
paymentRouter.post("/stripe/verify", auth, validateBody(stripeVerifySchema), verifyStripe);
paymentRouter.post("/khalti/verify", auth, validateBody(khaltiVerifySchema), verifyKhalti);
paymentRouter.get("/khalti/callback", khaltiCallback);
paymentRouter.get("/esewa/redirect/:transactionUuid", esewaRedirect);
paymentRouter.post("/esewa/success", esewaSuccess);
paymentRouter.get("/esewa/success", esewaSuccess);
paymentRouter.post("/esewa/failure", esewaFailure);
paymentRouter.get("/esewa/failure", esewaFailure);
paymentRouter.post("/esewa/verify", auth, validateBody(esewaVerifySchema), verifyEsewa);
paymentRouter.get("/transactions", auth, getPaymentTransactions);

export default paymentRouter;
