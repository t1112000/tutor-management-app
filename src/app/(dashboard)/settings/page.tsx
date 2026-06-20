import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { User } from "@/lib/db/index";

export const metadata: Metadata = { title: "Cài đặt | MyClass" };
import SettingsClient from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/signin");

  const dbUser = await User.findByPk(session.user.id);

  return (
    <SettingsClient
      userEmail={session.user.email ?? ""}
      userName={dbUser?.name ?? null}
      notificationsEnabled={dbUser?.pushEnabled ?? false}
    />
  );
}
