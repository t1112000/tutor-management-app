import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { User } from "@/lib/db/index";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import DailySplash from "@/components/layout/DailySplash";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/signin");

  const dbUser = await User.findByPk(session.user.id);

  return (
    <div className="flex h-[100dvh]">
      <DailySplash />
      <Sidebar user={{ ...session.user, name: dbUser?.name ?? session.user.name }} />
      <main className="flex-1 overflow-hidden pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
