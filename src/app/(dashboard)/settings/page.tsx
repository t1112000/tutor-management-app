import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <SettingsClient userId={session.user.id} userEmail={session.user.email ?? ""} />;
}
