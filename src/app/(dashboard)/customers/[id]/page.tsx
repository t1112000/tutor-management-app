import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import CustomerDetailClient from "@/components/customers/CustomerDetailClient";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/signin");
  const { id } = await params;
  return <CustomerDetailClient customerId={Number(id)} />;
}
