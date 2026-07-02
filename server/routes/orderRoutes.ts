import  express  from "express";
import auth from "../middleware/auth.js";
import {
  confirmStripePayment,
  createOrder,
  getAllOrders,
  getOrder,
  getOrderLocation,
  getOrderReceipt,
  getUserOrders,
  retryOrderPayment,
  updateOrderStatus,
} from "../controllers/orderController.js";
import admin from "../middleware/admin.js";
import { validateBody } from "../middleware/validate.js";
import { createOrderSchema, orderStatusSchema, paymentVerifySchema } from "../schemas/apiSchemas.js";


const orderRouter = express.Router();

orderRouter.post('', auth, validateBody(createOrderSchema), createOrder);
orderRouter.get('/',auth, getUserOrders);
orderRouter.get('/all', auth, admin, getAllOrders);
orderRouter.post('/:id/confirm-payment', auth, validateBody(paymentVerifySchema), confirmStripePayment);
orderRouter.post('/:id/retry-payment', auth, retryOrderPayment);
orderRouter.get('/:id/receipt', auth, getOrderReceipt);
orderRouter.get('/:id', auth, getOrder);
orderRouter.put('/:id/status', auth, admin, validateBody(orderStatusSchema), updateOrderStatus)
orderRouter.get('/:id/location', auth, getOrderLocation )

export default orderRouter
