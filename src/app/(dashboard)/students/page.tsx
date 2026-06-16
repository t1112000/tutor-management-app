import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import StudentsClient from "@/components/students/StudentsClient";

export default async function StudentsPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <StudentsClient />;
}
