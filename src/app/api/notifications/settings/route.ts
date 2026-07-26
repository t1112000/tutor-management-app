import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody } from "@/lib/auth-helpers";
import { User } from "@/lib/db/index";
import { notificationSettingsSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, notificationSettingsSchema);
  if (badBody) return badBody;

  await User.update({ pushEnabled: value.notificationsEnabled }, { where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
