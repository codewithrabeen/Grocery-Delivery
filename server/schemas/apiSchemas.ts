import { z } from "zod";

export const emailSchema = z.string().trim().email().max(255).toLowerCase();
export const passwordSchema = z.string().min(6).max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const googleLoginSchema = z.object({
  credential: z.string().trim().min(1),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  avatar: z.string().trim().url().or(z.literal("")).optional(),
  dob: z.string().datetime().or(z.literal("")).optional(),
  gender: z.string().trim().max(40).optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  newPassword: passwordSchema,
});

export const tokenSchema = z.object({
  token: z.string().trim().min(1),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(80),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  zip: z.string().trim().min(1).max(30),
  isDefault: z.coerce.boolean().optional().default(false),
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
});

export const productSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional().default(""),
  price: z.coerce.number().positive(),
  originalPrice: z.coerce.number().min(0).optional().default(0),
  image: z.string().trim().min(1),
  category: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(60).optional().default("piece"),
  stock: z.coerce.number().int().min(0).optional().default(0),
  isOrganic: z.coerce.boolean().optional().default(false),
  isFeatured: z.coerce.boolean().optional().default(false),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  reviewCount: z.coerce.number().int().min(0).optional().default(0),
});

export const productUpdateSchema = productSchema.partial();

export const productQuerySchema = z.object({
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  availability: z.enum(["all", "in-stock", "out-of-stock"]).optional(),
  featured: z.coerce.boolean().optional(),
  sort: z
    .enum(["popular", "best-selling", "newest", "price-low", "price-high", "rating", "featured"])
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(48),
});

export const shippingAddressSchema = z.object({
  label: z.string().trim().min(1).max(80),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  zip: z.string().trim().min(1).max(30),
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
});

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().trim().min(1).optional(),
      id: z.string().trim().min(1).optional(),
      product: z.string().trim().min(1).optional(),
      quantity: z.coerce.number().int().positive(),
      price: z.coerce.number().positive().optional(),
    }),
  ),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["cash", "card", "stripe", "khalti", "esewa", "wallet"]).default("cash"),
  deliveryWindow: z.string().trim().max(100).optional(),
  couponCode: z.string().trim().max(80).optional(),
});

export const paymentVerifySchema = z.object({
  sessionId: z.string().trim().optional(),
  pidx: z.string().trim().optional(),
  transactionUuid: z.string().trim().optional(),
  data: z.string().trim().optional(),
});

export const wishlistSchema = z.object({
  productId: z.string().trim().min(1),
});

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1).max(80),
  subtotal: z.coerce.number().min(0),
});

export const couponSchema = z.object({
  code: z.string().trim().min(1).max(80).toUpperCase(),
  description: z.string().trim().max(500).optional().default(""),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().positive(),
  minimumOrder: z.coerce.number().min(0).optional().default(0),
  maximumDiscount: z.coerce.number().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().optional().default(1),
  isActive: z.coerce.boolean().optional().default(true),
});

export const walletRechargeSchema = z.object({
  amount: z.coerce.number().positive(),
  reference: z.string().trim().max(120).optional(),
});

export const reviewSchema = z.object({
  productId: z.string().trim().min(1),
  orderId: z.string().trim().min(1).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().default(""),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "Pending",
    "Confirmed",
    "Packed",
    "Out For Delivery",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
    "Returned",
    "Payment Pending",
    "Payment Failed",
    "Refunded",
    "Assigned",
    "Placed",
  ]),
  note: z.string().trim().max(500).optional(),
});
