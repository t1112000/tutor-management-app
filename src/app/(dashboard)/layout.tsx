import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <div className="flex h-[100dvh]">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-hidden pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
