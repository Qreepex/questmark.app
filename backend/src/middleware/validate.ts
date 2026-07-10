import type { RequestHandler } from "express";
import type { ZodType } from "zod";

interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Parses `request.body`/`params`/`query` against the given zod schemas and
 * replaces each with its parsed (and coerced) result before calling `next`.
 * Responds 400 with the zod issues on failure instead of reaching the handler.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (request, response, next) => {
    if (schemas.params) {
      const result = schemas.params.safeParse(request.params);

      if (!result.success) {
        response
          .status(400)
          .json({ error: "Validation failed", details: result.error.issues });
        return;
      }

      request.params = result.data as typeof request.params;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(request.query);

      if (!result.success) {
        response
          .status(400)
          .json({ error: "Validation failed", details: result.error.issues });
        return;
      }

      // In Express 5, `req.query` is a getter-only property on the prototype
      // (computed from the URL), so plain assignment throws at runtime even
      // though TypeScript allows it. Shadow it with an own, writable property.
      Object.defineProperty(request, "query", {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(request.body);

      if (!result.success) {
        response
          .status(400)
          .json({ error: "Validation failed", details: result.error.issues });
        return;
      }

      request.body = result.data;
    }

    next();
  };
}
