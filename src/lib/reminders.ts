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
        // Bill is not paranoid, so soft-deleted invoices must be excluded here
        // too — otherwise the push count contradicts what the calendar shows.
        where: { createdBy: userId, deletedAt: null },
        include: [{ model: Student, as: "student", where: { deletedAt: null }, required: true }],
      },
    ],
  });

  const { User } = await import("@/lib/db/index");
  const user = await User.findByPk(userId);
  if (!user?.pushSubscription) {
    console.log(`[reminders] user=${userId} ${today}: ${sessions.length} session(s) — no push subscription`);
    return sessions.length;
  }

  const body =
    sessions.length === 0
      ? "Hôm nay bé iu không có lịch dạy, cố gắng nghỉ ngơi cho một ngày thật đã nha 🌸"
      : sessions.length === 1
      ? "Bạn có 1 buổi dạy hôm nay"
      : `Bạn có ${sessions.length} buổi dạy hôm nay`;

  try {
    await sendPush(user.pushSubscription as PushSubscription, {
      title: "MyClass — Nhắc lịch dạy",
      body,
      url: "/bills",
    });
    console.log(`[reminders] user=${userId} ${today}: push sent (${sessions.length} sessions)`);
  } catch (err) {
    // 404/410 means the browser dropped the subscription (reinstall, PWA removed).
    // Clear it, otherwise Settings keeps claiming notifications are on while the
    // user silently never receives another reminder.
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await user.update({ pushSubscription: null, pushEnabled: false });
      console.warn(`[reminders] user=${userId}: subscription expired (${statusCode}), cleared`);
    } else {
      console.error(`[reminders] user=${userId} push failed:`, err);
    }
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
