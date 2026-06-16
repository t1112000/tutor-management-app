import { auth } from "../../auth";
import { NextResponse } from "next/server";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user: session.user as { id: number; name?: string | null; email?: string | null; image?: string | null }, response: null };
}
