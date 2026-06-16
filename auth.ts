import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { upsertUserByEmail } from "@/lib/db/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (account && user?.email) {
        const dbUser = await upsertUserByEmail({
          email: user.email,
          name: user.name,
          image: user.image,
          googleId: account.providerAccountId,
        });
        token.uid = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) {
        session.user.id = token.uid as number;
      }
      return session;
    },
  },
});
