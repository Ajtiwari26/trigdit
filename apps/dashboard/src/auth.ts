import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import { authConfig } from './auth.config';

const { handlers, auth: rawAuth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  ...authConfig,
});

export { handlers, signIn, signOut };
export const auth = rawAuth as {
  (fn: (req: any, ctx: any) => any): any;
  (): Promise<any>;
};
