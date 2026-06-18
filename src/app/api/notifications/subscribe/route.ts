import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { User } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await req.json();
  if (!body || !body.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await User.update({ pushSubscription: body }, { where: { id: user!.id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  await User.update({ pushSubscription: null, pushEnabled: false }, { where: { id: user!.id } });
  return NextResponse.json({ ok: true });
}
