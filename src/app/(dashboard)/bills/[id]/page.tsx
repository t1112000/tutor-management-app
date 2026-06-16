import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import BillDetailClient from "@/components/bills/BillDetailClient";

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/signin");
  const { id } = await params;
  return <BillDetailClient billId={Number(id)} />;
}
