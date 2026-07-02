import express from "express";
import { getWallet, rechargeWallet } from "../controllers/walletController.js";
import auth from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { walletRechargeSchema } from "../schemas/apiSchemas.js";

const walletRouter = express.Router();

walletRouter.get("/", auth, getWallet);
walletRouter.post("/recharge", auth, validateBody(walletRechargeSchema), rechargeWallet);

export default walletRouter;
