import { NextFunction, Request, Response } from "express";
import { Prisma, User } from "../generated/prisma/client.js";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export const sanitizeUser = (user: User | null) => {
  if (!user) return null;
  const { password, refreshToken, ...safeUser } = user;

  return {
    ...safeUser,
    isAdmin: user.role === "ADMIN",
  };
};

export const readJsonArray = (value: Prisma.JsonValue | null | undefined): any[] =>
  Array.isArray(value) ? [...value] : [];

export const readJsonObject = (value: Prisma.JsonValue | null | undefined): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};

export const nowIso = () => new Date().toISOString();

export const parseNumber = (value: unknown, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const routeParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value || "";
