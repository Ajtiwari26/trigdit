import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@trigdit/db';
import { authConfig } from './auth.config';

const { handlers, auth: rawAuth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  ...authConfig,
});

export { handlers, signIn, signOut };
export const auth = rawAuth as {
  (fn: (req: any, ctx: any) => any): any;
  (): Promise<any>;
};
