import { BillSession, Bill, Student } from "@/lib/db/index";
import { todayVN } from "@/lib/time";
import { sendPush } from "@/lib/webpush";
import type { PushSubscription } from "web-push";

async function remindForUser(userId: number, today: string): Promise<number> {
  const sessions = await BillSession.findAll({
    where: { scheduledDate: today },
    include: [
      {
        model: Bill,
        as: "bill",
        where: { status: "unpaid", createdBy: userId },
        include: [{ model: Student, as: "student" }],
      },
    ],
  });

  if (sessions.length === 0) return 0;

  const { User } = await import("@/lib/db/index");
  const user = await User.findByPk(userId);
  if (!user?.pushSubscription) {
    console.log(`[reminders] user=${userId} ${today}: ${sessions.length} session(s) — no push subscription`);
    return sessions.length;
  }

  const body =
    sessions.length === 1
      ? "Bạn có 1 buổi dạy hôm nay chưa thanh toán"
      : `Bạn có ${sessions.length} buổi dạy hôm nay chưa thanh toán`;

  try {
    await sendPush(user.pushSubscription as PushSubscription, {
      title: "MyClass — Nhắc lịch dạy",
      body,
      url: "/bills",
    });
    console.log(`[reminders] user=${userId} ${today}: push sent (${sessions.length} sessions)`);
  } catch (err) {
    console.error(`[reminders] user=${userId} push failed:`, err);
  }

  return sessions.length;
}

export async function runDailyReminders(): Promise<void> {
  const today = todayVN();
  const { User } = await import("@/lib/db/index");
  const users = await User.findAll({ where: { pushEnabled: true } });
  for (const user of users) {
    await remindForUser(user.id, today);
  }
}

export async function runRemindersForUser(userId: number): Promise<void> {
  await remindForUser(userId, todayVN());
}
