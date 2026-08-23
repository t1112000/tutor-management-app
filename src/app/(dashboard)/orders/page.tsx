import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import OrdersClient from "@/components/orders/OrdersClient";

export const metadata: Metadata = { title: "Đơn hàng | MyClass" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <OrdersClient />;
}
