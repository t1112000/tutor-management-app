import { BillSession, Bill, Student } from "@/lib/db/index";
import { todayVN } from "@/lib/time";

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

  console.log(`[reminders] user=${userId} ${today}: ${sessions.length} session(s)`);
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
