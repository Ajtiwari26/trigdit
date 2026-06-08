import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export * from './schema';
export { eq, and, or, desc, sql } from 'drizzle-orm';

let dbInstance: any;

if (process.env.DATABASE_URL) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  dbInstance = drizzle(pool, { schema });
} else {
  // Proxy object to prevent crashes on schema initialization
  dbInstance = new Proxy({} as any, {
    get(target, prop) {
      if (prop === 'query') {
        return new Proxy({} as any, {
          get(t, p) {
            return {
              findFirst: async () => null,
              findMany: async () => [],
            };
          }
        });
      }
      return () => {
        console.warn('Database not configured. Returning empty placeholder.');
        return {
          returning: () => [],
          values: () => ({ returning: () => [] }),
        };
      };
    }
  });
}

export const db = dbInstance;
