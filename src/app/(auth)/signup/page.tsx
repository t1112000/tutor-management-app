import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import SignUpForm from "@/components/auth/SignUpForm";

export default async function SignUpPage() {
  const session = await auth();
  if (session) redirect("/");
  return <SignUpForm />;
}
