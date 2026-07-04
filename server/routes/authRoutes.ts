import express from "express";
import {
  changePassword,
  deleteAccount,
  forgotPassword,
  getProfile,
  googleLogin,
  login,
  refreshToken,
  register,
  resetPassword,
  sendVerificationEmail,
  updateProfile,
  verifyEmail,
} from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  profileUpdateSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
} from "../schemas/apiSchemas.js";

const authRouter = express.Router();
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/google", validateBody(googleLoginSchema), googleLogin);
authRouter.post("/refresh-token", validateBody(refreshTokenSchema), refreshToken);
authRouter.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);
authRouter.get("/profile", auth, getProfile);
authRouter.put("/profile", auth, validateBody(profileUpdateSchema), updateProfile);
authRouter.put("/change-password", auth, validateBody(changePasswordSchema), changePassword);
authRouter.post("/change-password", auth, validateBody(changePasswordSchema), changePassword);
authRouter.post("/send-verification-email", auth, sendVerificationEmail);
authRouter.post("/verify-email", validateBody(tokenSchema), verifyEmail);
authRouter.delete("/profile", auth, deleteAccount);

export default authRouter;

