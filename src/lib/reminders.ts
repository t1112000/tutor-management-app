import { BillSession, Bill, Student, User } from "@/lib/db/index";
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
        include: [
          { model: Student, as: "student" },
          { model: User, as: "creator" },
        ],
      },
    ],
  });

  const byUser = new Map<number, { user: any; sessions: any[] }>();

  for (const session of sessions) {
    const bill = (session as any).bill;
    if (!bill) continue;
    const creator: any = bill.creator;
    if (!creator) continue;
    const uid = creator.id;
    if (!byUser.has(uid)) byUser.set(uid, { user: creator, sessions: [] });
    byUser.get(uid)!.sessions.push({ session, student: bill.student });
  }

  for (const { user, sessions: userSessions } of byUser.values()) {
    const sessionInfos = userSessions
      .sort((a: any, b: any) => a.session.startTime.localeCompare(b.session.startTime))
      .map(({ session, student }: any) => ({
        studentName: student.name,
        subject: student.subject,
        startTime: session.startTime,
        endTime: session.endTime,
      }));

    if (user.pushEnabled && user.pushSubscription) {
      try {
        const { sendPush } = await import("./webpush");
        await sendPush(user.pushSubscription, {
          title: "Lịch dạy hôm nay",
          body: sessionInfos.map((s: any) => `${s.startTime} – ${s.studentName}`).join("\n"),
          url: "/calendar",
        });
      } catch {}
    }

    if (user.emailEnabled && user.notificationEmail) {
      try {
        const { sendReminderEmail } = await import("./email");
        await sendReminderEmail(user.notificationEmail, today, sessionInfos);
      } catch {}
    }
  }
}
