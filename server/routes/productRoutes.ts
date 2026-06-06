import  express  from "express";
import { createProduct, getFlashDeals, getProducts } from '../controllers/productController.js';
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
const productRouter = express.Router();

productRouter.get('/flash-deals', getFlashDeals);
productRouter.get('/', getProducts);
productRouter.get('/flash-deals/:id', getProducts);
productRouter.post('/', auth, admin, createProduct);
productRouter.put('/:id', auth, admin, createProduct);
productRouter.delete('/:id', auth, admin, createProduct);




export default productRouter;