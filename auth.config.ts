import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = !nextUrl.pathname.startsWith("/signin") &&
        !nextUrl.pathname.startsWith("/not-authorized") &&
        !nextUrl.pathname.startsWith("/api/auth");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
    signIn({ user }) {
      if (!user.email) return false;
      if (allowedEmails.length === 0) return true; // dev: allow all
      return allowedEmails.includes(user.email);
    },
  },
};
