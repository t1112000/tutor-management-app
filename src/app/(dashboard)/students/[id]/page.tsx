import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import StudentDetailClient from "@/components/students/StudentDetailClient";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/signin");
  const { id } = await params;
  return <StudentDetailClient studentId={Number(id)} />;
}
