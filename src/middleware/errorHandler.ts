import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : undefined;

  if (code === "P2021") {
    return res.status(503).json({
      error: "database_not_ready",
      message:
        "Database tables are missing. Apply migrations, then seed: npx prisma migrate deploy && npm run db:seed",
    });
  }

  if (code === "P1001") {
    return res.status(503).json({
      error: "database_unreachable",
      message:
        "Cannot reach the database. Check DATABASE_URL / PG_CONNECTION_URL and that PostgreSQL is running.",
    });
  }

  console.error(err);
  const dev = process.env.NODE_ENV === "development";
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  return res.status(500).json({
    error: "internal_error",
    ...(dev ? { message, stack: err instanceof Error ? err.stack : undefined } : {}),
  });
}
