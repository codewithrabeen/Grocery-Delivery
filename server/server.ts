import "dotenv/config";
import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";
import authRouter from './routes/authRoutes.js';
import productRouter from './routes/productRoutes.js';
import uploadRouter from './routes/uploadRoutes.js';
import orderRouter from "./routes/orderRoutes.js";

import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import addressRouter from "./routes/addressRoutes.js";
import adminRouter from "./routes/adminRoute.js";
import deliveryPartnerRouter from "./routes/deliveryPartnerRoutes.js";
import { stripeWebhook } from "./controllers/webhook.js";







const app = express();
app.post("/api/stripe", express.raw({type: 'application/json'}), stripeWebhook)

// Middleware
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 8000;

app.get('/', (req: Request, res: Response ) => {
    res.send('Server is Live!');
});

// Routes


app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/orders', orderRouter);
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/addresses', addressRouter);
app.use('/api/admin', adminRouter);
app.use('/api/delivery', deliveryPartnerRouter)





// error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});