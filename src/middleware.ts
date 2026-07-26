import NextAuth from "next-auth";
import { authConfig } from "../auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Must live under src/ — Next.js does not pick up a root-level middleware.ts
  // when the app lives in src/app, so this file was dead code there.
  //
  // Excluded on purpose:
  //  - anything with a file extension: manifest.json, sw.js, icons, backgrounds.
  //    A redirect on /sw.js is a hard service-worker failure, and redirected
  //    images break the signin page for a signed-out user.
  //  - /api: those routes answer with a 401 JSON from requireUser(); redirecting
  //    them to an HTML signin page would break every fetch() error path.
  matcher: [
    "/((?!api|_next|signin|not-authorized|.*\\..*).*)",
  ],
};
