import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ComingSoon from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Đơn hàng | MyClass" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return (
    <ComingSoon
      icon={ShoppingCart}
      title="Đơn hàng"
      description="Tính năng tạo và quản lý đơn hàng (KBH/BHF) sắp ra mắt."
    />
  );
}
