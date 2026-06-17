import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import CalendarClient from "@/components/calendar/CalendarClient";

export const metadata: Metadata = { title: "Lịch dạy | MyClass" };

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <CalendarClient />;
}
