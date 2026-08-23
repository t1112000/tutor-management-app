import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import OrderDetailClient from "@/components/orders/OrderDetailClient";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/signin");
  const { id } = await params;
  return <OrderDetailClient orderId={Number(id)} />;
}
