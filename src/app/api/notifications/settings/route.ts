import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { User } from "@/lib/db/index";
import { notificationSettingsSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await req.json();
  const parsed = notificationSettingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await User.update(
    {
      pushEnabled: parsed.data.pushEnabled,
      emailEnabled: parsed.data.emailEnabled,
      notificationEmail: parsed.data.notificationEmail || null,
    },
    { where: { id: user!.id } }
  );
  return NextResponse.json({ ok: true });
}
