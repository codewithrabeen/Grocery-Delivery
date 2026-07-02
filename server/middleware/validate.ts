import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodType } from "zod";

export const validateBody =
  <T extends ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(parsed.error),
      });
    }

    req.body = parsed.data;
    next();
  };

export const validateQuery =
  <T extends ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: formatZodErrors(parsed.error),
      });
    }

    for (const key of Object.keys(req.query)) {
      delete (req.query as Record<string, unknown>)[key];
    }
    Object.assign(req.query, parsed.data);
    next();
  };

const formatZodErrors = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

export const idParamSchema = z.object({
  id: z.string().trim().min(1),
});
