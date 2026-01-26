import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./db/index";
export * from "./db/index";

export const db = drizzle(process.env.DATABASE_URL, { schema });

export default db;
