import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const globalForDb = globalThis as unknown as {
  sql: postgres.Sql | undefined;
  db: PostgresJsDatabase<typeof schema> | undefined;
};

function createDb(): PostgresJsDatabase<typeof schema> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in .env.local — see .env.example."
    );
  }
  const sql =
    globalForDb.sql ??
    postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 1 : 10,
      prepare: false,
    });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.sql = sql;
  }
  return drizzle(sql, { schema });
}

function getDb(): PostgresJsDatabase<typeof schema> {
  if (!globalForDb.db) {
    globalForDb.db = createDb();
  }
  return globalForDb.db;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});
