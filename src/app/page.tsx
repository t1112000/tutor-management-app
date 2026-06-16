import { auth } from "../../auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto">
        <DashboardContent userId={session.user.id} />
      </main>
    </div>
  );
}
