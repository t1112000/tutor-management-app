import type { Metadata } from "next";
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/dashboard/DashboardContent";

export const metadata: Metadata = { title: "Tổng quan | MyClass" };

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/signin");

  return <DashboardContent userId={(session.user as any).id} />;
}
