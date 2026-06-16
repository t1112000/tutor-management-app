import cron from "node-cron";
import { runDailyReminders } from "@/lib/reminders";

const g = globalThis as any;

if (!g.__cronStarted) {
  cron.schedule(
    "0 7 * * *",
    async () => {
      try {
        await runDailyReminders();
      } catch (err) {
        console.error("[cron] runDailyReminders error:", err);
      }
    },
    { timezone: "Asia/Ho_Chi_Minh" }
  );
  g.__cronStarted = true;
}
