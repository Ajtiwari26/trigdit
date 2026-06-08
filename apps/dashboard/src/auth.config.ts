import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email repo write:repo_hook',
        },
      },
    }),
    Credentials({
      id: 'credentials',
      name: 'Mock Developer Account',
      credentials: {},
      async authorize() {
        return {
          id: 'usr_mock_123',
          name: 'Workspace Administrator',
          email: 'admin@trigdit.com',
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account && account.provider === 'github') {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session as any).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;
