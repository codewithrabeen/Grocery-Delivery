import { NextFunction, Request, Response } from "express";

const forbiddenKeys = new Set(["__proto__", "prototype", "constructor"]);

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeValue);

  if (value && typeof value === "object") {
    const clean: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (forbiddenKeys.has(key) || key.startsWith("$")) continue;
      clean[key] = sanitizeValue(nestedValue);
    }

    return clean;
  }

  if (typeof value === "string") {
    return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();
  }

  return value;
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  req.body = sanitizeValue(req.body) as Request["body"];
  sanitizeObjectInPlace(req.query, sanitizeValue(req.query));
  sanitizeObjectInPlace(req.params, sanitizeValue(req.params));
  next();
};

const sanitizeObjectInPlace = (target: unknown, sanitized: unknown) => {
  if (!target || typeof target !== "object" || !sanitized || typeof sanitized !== "object") {
    return;
  }

  for (const key of Object.keys(target)) {
    delete (target as Record<string, unknown>)[key];
  }

  Object.assign(target, sanitized);
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};
