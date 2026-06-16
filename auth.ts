import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { upsertUserByGoogle } from "@/lib/db/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && account.providerAccountId && user?.email) {
        const dbUser = await upsertUserByGoogle({
          email: user.email,
          name: user.name,
          image: user.image,
          googleId: account.providerAccountId,
        });
        // null means email belongs to a different Google account — refuse
        if (!dbUser) return { ...token, error: "account_conflict" };
        token.uid = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) {
        (session.user as any).id = token.uid;
      }
      return session;
    },
  },
});
