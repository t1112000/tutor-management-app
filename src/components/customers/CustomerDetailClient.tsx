"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QueryErrorState } from "@/components/ui/query-error";
import { useCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/queries/use-customer";
import type { CustomerContact, CustomerContactType } from "@/hooks/queries/use-customers";
import { formatInTimeZone } from "date-fns-tz";
import { VN_TZ, formatDateVN, formatMoneyVND } from "@/lib/time";

const CONTACT_TYPES = [
  { type: "facebook" as const, label: "Facebook" },
  { type: "zalo" as const, label: "Zalo" },
  { type: "discord" as const, label: "Discord" },
  { type: "telegram" as const, label: "Telegram" },
];

const EMPTY_CONTACTS: Record<CustomerContactType, string> = {
  facebook: "",
  zalo: "",
  discord: "",
  telegram: "",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#FFF8FA", border: "1px solid #F4D8DE",
  borderRadius: "10px", padding: "8px 10px", fontSize: "14px",
  color: "#2C1820", outline: "none", fontFamily: "inherit",
};

interface Props {
  customerId: number;
}

function contactsToForm(contacts: CustomerContact[]): Record<CustomerContactType, string> {
  const next = { ...EMPTY_CONTACTS };
  for (const c of contacts) next[c.type] = c.value;
  return next;
}

function formatOrderDate(createdAt: string): string {
  return formatDateVN(formatInTimeZone(new Date(createdAt), VN_TZ, "yyyy-MM-dd"));
}

export default function CustomerDetailClient({ customerId }: Props) {
  const router = useRouter();
  const { data: customer, isLoading, isError, refetch } = useCustomer(customerId);
  const { mutate: updateCustomer, isPending: saving } = useUpdateCustomer(customerId);
  const { mutate: deleteCustomer, isPending: deleting } = useDeleteCustomer(customerId);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", notes: "", contacts: EMPTY_CONTACTS });

  if (isLoading) return <div style={{ padding: "32px", textAlign: "center", color: "#A87888" }}>Đang tải...</div>;
  if (isError || !customer) return <QueryErrorState message="Không tải được khách hàng" onRetry={() => refetch()} />;

  function startEdit() {
    if (!customer) return;
    setForm({
      name: customer.name,
      notes: customer.notes ?? "",
      contacts: contactsToForm(customer.contacts),
    });
    setEditing(true);
  }

  function save() {
    if (!form.name.trim()) { toast.error("Tên khách không được trống"); return; }
    updateCustomer(
      {
        name: form.name.trim(),
        notes: form.notes.trim(),
        contacts: CONTACT_TYPES
          .map(({ type }) => ({ type, value: form.contacts[type].trim() }))
          .filter((c) => c.value !== ""),
      },
      {
        onSuccess: () => { toast.success("Đã lưu"); setEditing(false); },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Lưu thất bại"),
      }
    );
  }

  function remove() {
    deleteCustomer(undefined, {
      onSuccess: () => { toast.success("Đã xoá khách"); router.push("/customers"); },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Xoá thất bại"),
    });
  }

  const contactValue = (type: CustomerContactType) =>
    customer.contacts.find((c) => c.type === type)?.value;

  return (
    <div style={{ padding: "24px 32px", maxWidth: "560px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button onClick={() => router.push("/customers")} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#6B4858", cursor: "pointer", fontSize: "14px" }}>
          <ChevronLeft size={16} /> Khách hàng
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          {!editing && (
            <button onClick={startEdit} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", color: "#6B4858", cursor: "pointer" }}>
              <Pencil size={13} /> Chỉnh sửa
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", color: "#dc2626", cursor: "pointer" }}>
                <Trash2 size={13} /> Xoá
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xoá khách hàng?</AlertDialogTitle>
                <AlertDialogDescription>
                  Khách {customer.name} sẽ bị xoá. Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction onClick={remove} disabled={deleting} style={{ background: "#E11D48", color: "white" }}>
                  {deleting ? "Đang xoá..." : "Xoá khách"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Tên</div>
          {editing ? (
            <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820" }}>{customer.name}</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Ghi chú</div>
          {editing ? (
            <input style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820" }}>{customer.notes ?? "—"}</div>
          )}
        </div>

        {CONTACT_TYPES.map(({ type, label }) => (
          <div key={type}>
            <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>{label}</div>
            {editing ? (
              <input
                style={inputStyle}
                value={form.contacts[type]}
                onChange={(e) => setForm({ ...form, contacts: { ...form.contacts, [type]: e.target.value } })}
              />
            ) : (
              <div style={{ fontSize: "14px", color: "#2C1820" }}>{contactValue(type) ?? "—"}</div>
            )}
          </div>
        ))}

        {editing && (
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "10px 0", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              Huỷ
            </button>
            <button type="button" onClick={save} disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "10px 0", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: "24px", background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px" }}>
        <h2 style={{ fontWeight: 600, fontSize: "16px", color: "#2C1820", margin: "0 0 16px" }}>Đơn hàng</h2>
        {customer.orders.length === 0 ? (
          <p style={{ color: "#A87888", fontSize: "13px", margin: 0 }}>Chưa có đơn hàng</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {customer.orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "12px 14px",
                  border: "1px solid #F4D8DE",
                  borderRadius: "10px",
                  textDecoration: "none",
                  background: "#FFF8FA",
                }}
              >
                <span style={{ fontSize: "13px", color: "#6B4858" }}>{formatOrderDate(o.createdAt)}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820" }}>{formatMoneyVND(o.totalPrice)}</span>
                <span style={{ fontSize: "13px", color: "#A87888" }}>{o.lineCount} tài khoản</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
