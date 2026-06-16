import { auth } from "../../../../../../../auth";
import { redirect } from "next/navigation";
import CreateBillClient from "@/components/bills/CreateBillClient";

export default async function NewBillPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/signin");
  const { id } = await params;
  return <CreateBillClient studentId={Number(id)} />;
}
