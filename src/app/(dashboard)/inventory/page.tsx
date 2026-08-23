import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import InventoryClient from "@/components/inventory/InventoryClient";

export const metadata: Metadata = { title: "Kho tài khoản | MyClass" };

export default async function InventoryPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <InventoryClient />;
}
