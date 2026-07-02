import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { serve } from "inngest/express";
import { stripeWebhook } from "./controllers/webhook.js";
import { requestLogger, sanitizeInput } from "./middleware/security.js";
import addressRouter from "./routes/addressRoutes.js";
import adminRouter from "./routes/adminRoute.js";
import authRouter from "./routes/authRoutes.js";
import couponRouter from "./routes/couponRoutes.js";
import deliveryPartnerRouter from "./routes/deliveryPartnerRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import productRouter from "./routes/productRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import walletRouter from "./routes/walletRoutes.js";
import wishlistRouter from "./routes/wishlistRoutes.js";
import { functions, inngest } from "./inngest/index.js";
import { ApiError } from "./utils/api.js";

const app = express();
const port = process.env.PORT || 8000;

app.set("trust proxy", 1);

app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhook);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (
        process.env.CORS_ORIGINS ||
        process.env.CLIENT_URL ||
        "http://localhost:5173"
      )
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX ?? 300),
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(requestLogger);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

app.get("/", (_req: Request, res: Response) => {
  res.send("Server is Live!");
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/orders", orderRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/addresses", addressRouter);
app.use("/api/admin", adminRouter);
app.use("/api/delivery", deliveryPartnerRouter);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack || err);
  const statusCode = err instanceof ApiError ? err.statusCode : err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal Server Error" : err.message,
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
