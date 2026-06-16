import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import CalendarClient from "@/components/calendar/CalendarClient";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <CalendarClient />;
}
