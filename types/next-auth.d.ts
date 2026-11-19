import "next-auth";
import "next-auth/jwt";
import type { AccountType } from "@/lib/db/models/User";

declare module "next-auth" {
  interface User {
    accountType?: AccountType;
  }

  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accountType: AccountType;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: number;
    accountType?: AccountType;
  }
}
