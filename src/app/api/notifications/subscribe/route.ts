import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { User } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const subscription = await req.json();
  await User.update({ pushSubscription: subscription, pushEnabled: true }, { where: { id: user!.id } });
  return NextResponse.json({ ok: true });
}
