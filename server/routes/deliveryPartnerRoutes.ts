import express from 'express';
import { z } from "zod";
import { cancelDelivery, completeDelivery, getDeliveryDetail, getMydeliveries, loginPartner, updateDeliveryStatus, updateLocation } from '../controllers/deliveryPartnerController.js';
import deliveryAuth from '../middleware/deliveryAuth.js';
import { validateBody } from '../middleware/validate.js';

const deliveryPartnerRouter = express.Router();

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

const otpSchema = z.object({ otp: z.string().trim().min(4).max(10) });
const cancelSchema = z.object({ reason: z.string().trim().max(500).optional() });
const statusSchema = z.object({ status: z.enum(["Packed", "Out For Delivery", "Out for Delivery"]) });
const locationSchema = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
});

deliveryPartnerRouter.post('/login', validateBody(loginSchema), loginPartner)

deliveryPartnerRouter.get('/my-deliveries', deliveryAuth, getMydeliveries)
deliveryPartnerRouter.get('/my-deliveries/:id', deliveryAuth, getDeliveryDetail)
deliveryPartnerRouter.put('/my-deliveries/:id/complete', deliveryAuth, validateBody(otpSchema), completeDelivery)
deliveryPartnerRouter.put('/my-deliveries/:id/cancel', deliveryAuth, validateBody(cancelSchema), cancelDelivery)
deliveryPartnerRouter.put('/my-deliveries/:id/status', deliveryAuth, validateBody(statusSchema), updateDeliveryStatus)
deliveryPartnerRouter.put('/my-deliveries/:id/location', deliveryAuth, validateBody(locationSchema), updateLocation)




export default deliveryPartnerRouter
