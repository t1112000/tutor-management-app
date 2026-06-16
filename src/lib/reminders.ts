import { BillSession, Bill, Student } from "@/lib/db/index";
import { todayVN } from "@/lib/time";

export async function runDailyReminders(): Promise<void> {
  const today = todayVN();

  const sessions = await BillSession.findAll({
    where: { scheduledDate: today },
    include: [
      {
        model: Bill,
        as: "bill",
        where: { status: "unpaid" },
        include: [{ model: Student, as: "student" }],
      },
    ],
  });

  console.log(`[reminders] ${today}: ${sessions.length} session(s) scheduled today`);
}
