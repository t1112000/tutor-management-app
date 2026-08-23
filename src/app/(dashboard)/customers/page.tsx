import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import CustomersClient from "@/components/customers/CustomersClient";

export const metadata: Metadata = { title: "Khách hàng | MyClass" };

export default async function CustomersPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  return <CustomersClient />;
}
