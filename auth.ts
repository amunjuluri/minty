import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import type { AuthOptions, DefaultSession } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Define the structure of your custom session
interface CustomSession extends DefaultSession {
  accessToken?: string;
  user: {
    id: string;
  } & DefaultSession['user'];
}

// Define the account structure from GitHub provider
interface GitHubAccount {
  access_token: string;
  providerAccountId: string;
  provider: string;
  type: string;
}

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }): Promise<CustomSession> {
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};