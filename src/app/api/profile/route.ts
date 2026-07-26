import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody } from "@/lib/auth-helpers";
import { User } from "@/lib/db/index";
import { profileSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, profileSchema);
  if (badBody) return badBody;

  await User.update({ name: value.name.trim() }, { where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
