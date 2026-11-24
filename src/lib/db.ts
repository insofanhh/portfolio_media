import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalDb = globalThis as unknown as { portfolioDb?: PrismaClient };
export const db = globalDb.portfolioDb ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.portfolioDb = db;
