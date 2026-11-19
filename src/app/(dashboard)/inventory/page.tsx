import type { Metadata } from "next";
import { Package } from "lucide-react";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ComingSoon from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Kho tài khoản | MyClass" };

export default async function InventoryPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return (
    <ComingSoon
      icon={Package}
      title="Kho tài khoản"
      description="Tính năng quản lý kho tài khoản Netflix, GPT Plus... sắp ra mắt."
    />
  );
}
