import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import AccountDetailClient from "@/components/inventory/AccountDetailClient";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/signin");
  const { id } = await params;
  return <AccountDetailClient accountId={Number(id)} />;
}
