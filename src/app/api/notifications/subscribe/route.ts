import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody } from "@/lib/auth-helpers";
import { User } from "@/lib/db/index";
import { pushSubscriptionSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  // The stored endpoint is later called server-side by web-push, so it must be
  // validated as a real HTTPS push-service URL rather than arbitrary JSON.
  const { value, response: badBody } = await parseBody(req, pushSubscriptionSchema);
  if (badBody) return badBody;

  await User.update({ pushSubscription: value }, { where: { id: user.id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  await User.update({ pushSubscription: null, pushEnabled: false }, { where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
