import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
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
    signIn({ user, account, profile }) {
      // Require verified email for Google accounts
      if (account?.provider === "google" && !profile?.email_verified) return false;
      if (!user.email) return false;
      // Fail-closed: empty allowlist only permitted outside production
      if (allowedEmails.length === 0) {
        return process.env.NODE_ENV !== "production";
      }
      return allowedEmails.includes(user.email.toLowerCase());
    },
  },
};
