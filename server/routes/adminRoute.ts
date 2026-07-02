import  express  from "express";
import { z } from "zod";
import admin from "../middleware/admin.js";
import auth from "../middleware/auth.js";
import {
  assignDeliveryPartner,
  createtDeliveryPartner,
  deleteDeliveryPartner,
  getAdminStats,
  getDeliveryPartners,
  updateDeliveryPartner,
} from "../controllers/adminController.js";
import { validateBody } from "../middleware/validate.js";

const adminRouter = express.Router();

const partnerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(6).max(128),
  phone: z.string().trim().min(5).max(30),
  vehicleType: z.string().trim().min(2).max(60).default("bike"),
});

const partnerUpdateSchema = partnerSchema.partial();

const assignSchema = z.object({
  partnerId: z.string().trim().min(1),
});

adminRouter.get('/stats', auth, admin, getAdminStats)
adminRouter.get('/delivery-partners', auth, admin, getDeliveryPartners)
adminRouter.post('/delivery-partners', auth, admin, validateBody(partnerSchema), createtDeliveryPartner)
adminRouter.put('/delivery-partners/:id', auth, admin, validateBody(partnerUpdateSchema), updateDeliveryPartner)
adminRouter.delete('/delivery-partners/:id', auth, admin, deleteDeliveryPartner)
adminRouter.put('/orders/:id/assign', auth, admin, validateBody(assignSchema), assignDeliveryPartner)

export default adminRouter;
