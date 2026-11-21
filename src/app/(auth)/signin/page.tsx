import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import SignInForm from "@/components/auth/SignInForm";
import { safeCallbackPath } from "@/lib/public-url";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const target = safeCallbackPath(callbackUrl);
  const session = await auth();
  if (session) redirect(target);
  return <SignInForm callbackUrl={target} />;
}
