import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export * from './schema';
export { eq, and, or, desc, sql } from 'drizzle-orm';

let dbInstance: any;

const store = {
  users: [] as any[],
  accounts: [] as any[],
  projects: [] as any[],
  integrations: [] as any[],
};

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
          get(t, queryTable) {
            const tableName = String(queryTable);
            const list = (store as any)[tableName] || [];
            return {
              findFirst: async () => {
                return list[0] || null;
              },
              findMany: async () => {
                return list;
              },
            };
          }
        });
      }
      return (table: any) => {
        console.warn('Database not configured. Returning mock/placeholder database values.');
        
        let tableName = 'unknown';
        for (const [key, val] of Object.entries(schema)) {
          if (val === table) {
            tableName = key;
            break;
          }
        }

        return {
          values: (vals: any) => {
            const result = {
              id: 'mock_' + Math.random().toString(36).substring(2, 11),
              createdAt: new Date(),
              updatedAt: new Date(),
              ...vals,
            };
            if ((store as any)[tableName]) {
              (store as any)[tableName].push(result);
            }
            const arrayResult = [result];
            return {
              returning: () => arrayResult,
              then: (resolve: any) => resolve(arrayResult),
            };
          },
          returning: () => [],
        };
      };
    }
  });
}

export const db = dbInstance;
