import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ReportClient from "@/components/report/ReportClient";

export const metadata: Metadata = { title: "Báo cáo | MyClass" };

export default async function ReportPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <ReportClient />;
}
