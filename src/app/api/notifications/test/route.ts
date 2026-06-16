import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { User } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const dbUser = await User.findByPk(user!.id);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const results: string[] = [];

  if (dbUser.pushEnabled && dbUser.pushSubscription) {
    try {
      const { sendPush } = await import("@/lib/webpush");
      await sendPush(dbUser.pushSubscription as any, {
        title: "Thử nghiệm thông báo",
        body: "Thông báo push hoạt động!",
      });
      results.push("push: ok");
    } catch {
      results.push("push: failed");
    }
  }

  if (dbUser.emailEnabled && dbUser.notificationEmail) {
    try {
      const { sendReminderEmail } = await import("@/lib/email");
      await sendReminderEmail(dbUser.notificationEmail, new Date().toISOString().slice(0, 10), [
        { studentName: "Thử nghiệm", subject: "english", startTime: "08:00", endTime: "09:30" },
      ]);
      results.push("email: ok");
    } catch {
      results.push("email: failed");
    }
  }

  return NextResponse.json({ results });
}
