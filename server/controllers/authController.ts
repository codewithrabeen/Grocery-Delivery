import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import sendEmail from "../config/nodemailer.js";
import { prisma } from "../config/prisma.js";
import { ApiError, asyncHandler, normalizeEmail, sanitizeUser } from "../utils/api.js";

const googleClient = new OAuth2Client();

const generateToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "30d") as any,
  });

const generateRefreshToken = (id: string) =>
  jwt.sign({ id, type: "refresh" }, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET as string), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "90d") as any,
  });

const generateActionToken = (id: string, type: "password-reset" | "email-verification") =>
  jwt.sign({ id, type }, process.env.JWT_SECRET as string, {
    expiresIn: "30m",
  });

const getAdminEmails = () =>
  process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((email) => normalizeEmail(email))
    : [];

const roleForEmail = (email: string) => (getAdminEmails().includes(normalizeEmail(email)) ? "ADMIN" : "USER");

const getUserWithAddresses = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    include: { addresses: true },
  });

const issueAuthResponse = async (res: Response, user: Awaited<ReturnType<typeof getUserWithAddresses>>, message: string, status = 200) => {
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const refreshToken = generateRefreshToken(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return res.status(status).json({
    success: true,
    message,
    token: generateToken(user.id),
    refreshToken,
    user: sanitizeUser(user),
  });
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    include: { addresses: true },
  });

  if (!user || user.deletedAt) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const expectedRole = roleForEmail(user.email);
  const currentUser =
    expectedRole === "ADMIN" && user.role !== "ADMIN"
      ? await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
          include: { addresses: true },
        })
      : user;

  return issueAuthResponse(res, currentUser, "Login successful");
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: roleForEmail(normalizedEmail),
    },
    include: { addresses: true },
  });

  return issueAuthResponse(res, user, "User registered successfully", 201);
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    throw new ApiError(503, "Google sign-in is not configured on this server.");
  }

  const { credential } = req.body;
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  const email = payload?.email ? normalizeEmail(payload.email) : "";

  if (!email || !payload?.email_verified) {
    return res.status(401).json({ message: "Google account email could not be verified" });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { addresses: true },
  });

  if (existingUser?.deletedAt) {
    return res.status(401).json({ message: "This account has been disabled" });
  }

  const expectedRole = roleForEmail(email);
  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: expectedRole === "ADMIN" && existingUser.role !== "ADMIN" ? "ADMIN" : existingUser.role,
          isEmailVerified: true,
          ...(payload.picture && !existingUser.avatar ? { avatar: payload.picture } : {}),
          ...(payload.name && !existingUser.name ? { name: payload.name } : {}),
        },
        include: { addresses: true },
      })
    : await prisma.user.create({
        data: {
          name: payload.name || email.split("@")[0],
          email,
          password: await bcrypt.hash(`google:${payload.sub}:${crypto.randomUUID()}`, 10),
          avatar: payload.picture || "",
          role: expectedRole,
          isEmailVerified: true,
        },
        include: { addresses: true },
      });

  return issueAuthResponse(res, user, "Google sign-in successful", existingUser ? 200 : 201);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const decoded = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET as string),
  ) as { id: string; type?: string };

  if (decoded.type !== "refresh") {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const user = await getUserWithAddresses(decoded.id);
  if (!user || user.deletedAt || user.refreshToken !== token) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const nextRefreshToken = generateRefreshToken(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: nextRefreshToken },
  });

  return res.json({
    success: true,
    token: generateToken(user.id),
    refreshToken: nextRefreshToken,
    user: sanitizeUser(user),
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserWithAddresses(req.user!.id);

  if (!user || user.deletedAt) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ success: true, user: sanitizeUser(user) });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, avatar, dob, gender } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
      ...(dob !== undefined ? { dob: dob ? new Date(dob) : null } : {}),
      ...(gender !== undefined ? { gender } : {}),
    },
    include: { addresses: true },
  });

  return res.json({
    success: true,
    message: "Profile updated successfully",
    user: sanitizeUser(user),
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, currentPassword, newPassword } = req.body;
  const passwordToVerify = oldPassword || currentPassword;

  if (!passwordToVerify) {
    return res.status(400).json({ message: "Old password is required" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(passwordToVerify, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Old password is incorrect" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return res.json({ success: true, message: "Password changed successfully" });
});

export const sendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await sendActionEmail(user.email, "Verify your grocery account", generateActionToken(user.id, "email-verification"), "verify-email");
  return res.json({ success: true, message: "Verification email sent" });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; type?: string };

  if (decoded.type !== "email-verification") {
    return res.status(400).json({ message: "Invalid verification token" });
  }

  const user = await prisma.user.update({
    where: { id: decoded.id },
    data: { isEmailVerified: true },
    include: { addresses: true },
  });

  return res.json({ success: true, message: "Email verified", user: sanitizeUser(user) });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(req.body.email) } });

  if (user && !user.deletedAt) {
    await sendActionEmail(user.email, "Reset your grocery account password", generateActionToken(user.id, "password-reset"), "reset-password");
  }

  return res.json({
    success: true,
    message: "If an account exists, a password reset email has been sent",
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; type?: string };

  if (decoded.type !== "password-reset") {
    return res.status(400).json({ message: "Invalid password reset token" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: decoded.id },
    data: {
      password: hashedPassword,
      refreshToken: "",
    },
  });

  return res.json({ success: true, message: "Password reset successfully" });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      deletedAt: new Date(),
      refreshToken: "",
    },
  });

  return res.json({ success: true, message: "Account deleted successfully" });
});

const sendActionEmail = async (email: string, subject: string, token: string, path: string) => {
  if (!process.env.SENDER_EMAIL || !(process.env.SMTP_USER || process.env.SMPT_USER)) {
    console.log(`${subject} skipped: SMTP is not configured`);
    return;
  }

  const url = `${process.env.CLIENT_URL || "http://localhost:5173"}/${path}?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject,
    body: `<p>Use this secure link to continue:</p><p><a href="${url}">${url}</a></p><p>This link expires in 30 minutes.</p>`,
  });
};
