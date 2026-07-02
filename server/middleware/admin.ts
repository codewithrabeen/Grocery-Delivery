import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";

const adminEmails = () =>
  process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase())
    : [];

const admin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (adminEmails().includes(user.email.toLowerCase()) && user.role !== "ADMIN") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    if (req.user) req.user.isAdmin = true;
    return next();
  } catch (error) {
    console.error("Admin verification failed:", error);
    return res.status(500).json({ message: "Admin verification failed" });
  }
};

export default admin;
