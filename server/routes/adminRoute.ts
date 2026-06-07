import  express  from "express";
import admin from "../middleware/admin.js";
import auth from "../middleware/auth.js";
import { assignDeliveryPartner, createtDeliveryPartner, getAdminStats, getDeliveryPartners, updateDeliveryPartner } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get('/stats', auth, admin, getAdminStats)
adminRouter.get('/delivery-partners', auth, admin, getDeliveryPartners)
adminRouter.post('/delivery-partners', auth, admin, createtDeliveryPartner)
adminRouter.put('/delivery-partners/:id', auth, admin, updateDeliveryPartner)
adminRouter.put('/orders/:id/assign', auth, admin, assignDeliveryPartner)

export default adminRouter;