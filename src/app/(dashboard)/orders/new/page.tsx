import type { Metadata } from "next";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import OrderCreateClient from "@/components/orders/OrderCreateClient";

export const metadata: Metadata = { title: "Tạo đơn | MyClass" };

export default async function NewOrderPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <OrderCreateClient />;
}
