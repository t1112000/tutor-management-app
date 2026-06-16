import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { runDailyReminders } from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  await runDailyReminders();
  return NextResponse.json({ ok: true, message: "Đã chạy nhắc nhở thủ công" });
}
