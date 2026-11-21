import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { buildSignInUrl } from "@/lib/public-url";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    // Public paths are excluded by the middleware matcher in src/middleware.ts,
    // so everything reaching this callback requires a session.
    //
    // The redirect is built by hand: the default one uses request.nextUrl, which
    // is `https://0.0.0.0:3000/` behind the reverse proxy (standalone server with
    // HOSTNAME=0.0.0.0), producing a broken callbackUrl. We use the public host
    // and a relative callbackUrl instead.
    authorized({ auth, request }) {
      if (auth?.user) return true;
      return NextResponse.redirect(buildSignInUrl(request.url, request.headers));
    },
  },
};
