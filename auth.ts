import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

/**
 * In-process brute-force guard. The app runs as a single replica (the cron job
 * requires it), so an in-memory map is enough — there is no second instance to
 * fall out of sync with.
 */
const attempts = new Map<string, { count: number; lockedUntil: number }>();

/** bcrypt hash of a value nobody can supply, used to keep the "user not found"
 *  path as slow as the real one so response time doesn't leak which emails exist. */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.WGGWa6TFwUmXwiMFy0GnO9ptxVMoNCq";

function checkLock(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return true;
  if (entry.lockedUntil > Date.now()) return false;
  if (entry.lockedUntil !== 0) attempts.delete(key);
  return true;
}

function recordFailure(key: string): void {
  const entry = attempts.get(key) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  attempts.set(key, entry);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase();

        if (!checkLock(email)) return null;

        const { User } = await import("@/lib/db/index");
        const user = await User.findOne({ where: { email: credentials.email } });

        // Always run a comparison, even when no account matches, so both paths
        // cost the same wall-clock time.
        const ok = await bcrypt.compare(
          String(credentials.password),
          user?.passwordHash ?? DUMMY_HASH
        );

        if (!user?.passwordHash || !ok) {
          recordFailure(email);
          return null;
        }

        attempts.delete(email);
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          image: user.image,
          accountType: user.accountType,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  // jwt/session/authorized all come from authConfig.callbacks — see auth.config.ts.
});
