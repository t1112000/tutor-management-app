import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError, findOwnedStudent } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  // Ownership is enforced by the helper; includeDeleted lets it find the soft-deleted row.
  const student = await findOwnedStudent(user.id, id, { includeDeleted: true });
  if (!student) return jsonError(404, "Không tìm thấy học sinh");

  if (student.deletedAt) await student.update({ deletedAt: null });
  return NextResponse.json({ ok: true });
}
