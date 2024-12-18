import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import type { AuthOptions, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Extend the default session type to include custom fields
interface CustomSession extends DefaultSession {
  accessToken?: string;
  user: {
    id: string;
    username?: string; // Add GitHub username
  } & DefaultSession["user"];
}

// Define the account structure from GitHub provider
interface GitHubAccount {
  access_token: string;
  providerAccountId: string;
  provider: string;
  type: string;
}

// Define the structure of the GitHub user profile
interface GitHubProfile {
  login: string; // GitHub username
  id: number;
  // Add other GitHub profile fields as needed
}

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = account.providerAccountId;
      }
      if (profile) {
        token.username = (profile as GitHubProfile).login;
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
          username: token.username as string,
        },
      };
    },
  },
  // pages: {
  //   signIn: "/auth/signin",
  //   error: "/auth/error",
  // },
};

export default NextAuth(authOptions);
