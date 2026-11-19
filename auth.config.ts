import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// accountType is fixed at signup, so these route sets are permanent, not a
// toggleable permission — a mismatch means the user followed a stale link or
// typed a URL for the other workflow, not that they lack a role.
const TUTOR_ONLY_PREFIXES = ["/students", "/calendar", "/bills"];
const RESELLER_ONLY_PREFIXES = ["/inventory", "/customers", "/orders"];

function requiredAccountType(pathname: string): "tutor" | "reseller" | null {
  const matches = (prefixes: string[]) =>
    prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (matches(TUTOR_ONLY_PREFIXES)) return "tutor";
  if (matches(RESELLER_ONLY_PREFIXES)) return "reseller";
  return null;
}

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    // jwt/session live here (not just in the full auth.ts instance) so the
    // edge middleware instance below — which only loads this shared config,
    // not the Node-only credentials provider — decodes accountType too.
    async jwt({ token, user }) {
      if (user?.id) token.uid = Number(user.id);
      if (user?.accountType) token.accountType = user.accountType;
      return token;
    },
    async session({ session, token }) {
      if (token.uid) (session.user as { id: number }).id = token.uid;
      if (token.accountType) session.user.accountType = token.accountType;
      return session;
    },
    // Public paths are excluded by the middleware matcher in src/middleware.ts,
    // so everything reaching this callback requires a session. Doing the
    // accountType redirect here (rather than in each page) is deliberate: a
    // redirect() thrown deep in a Server Component under the shared dashboard
    // layout can lose its HTTP-redirect status once the layout's shell has
    // started streaming, silently falling back to a client-side-only nudge.
    // Middleware runs before any of that, so the redirect is always a real one.
    authorized({ auth, request }) {
      if (!auth?.user) return false;
      const required = requiredAccountType(request.nextUrl.pathname);
      if (required && auth.user.accountType !== required) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return true;
    },
  },
};
