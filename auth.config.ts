import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    // Public paths are excluded by the middleware matcher in src/middleware.ts,
    // so everything reaching this callback requires a session.
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
};
