import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { User } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { name } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Tên không hợp lệ" }, { status: 400 });
  }

  await User.update({ name: name.trim() }, { where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
