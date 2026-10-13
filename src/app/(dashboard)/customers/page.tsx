import type { Metadata } from "next";
import { Contact } from "lucide-react";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ComingSoon from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Khách hàng | MyClass" };

export default async function CustomersPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return (
    <ComingSoon
      icon={Contact}
      title="Khách hàng"
      description="Tính năng quản lý thông tin khách hàng (liên hệ, bảo hành...) sắp ra mắt."
    />
  );
}
