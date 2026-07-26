"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatMoneyVND, formatDateVN } from "@/lib/time";
import { useDeleteBill } from "@/hooks/queries/use-bill";
import type { BillSummary } from "@/hooks/queries/use-student";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeleteBillButton({ billId, studentId }: { billId: number; studentId: number }) {
  const { mutate: deleteBill, isPending } = useDeleteBill(billId, studentId);
  function handleDelete() {
    deleteBill(undefined, {
      onSuccess: () => toast.success("Đã xoá hóa đơn"),
      onError: () => toast.error("Xoá thất bại"),
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "#FFF1F2", border: "1px solid #FECDD3",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Trash2 size={13} color="#E11D48" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá hóa đơn?</AlertDialogTitle>
          <AlertDialogDescription>
            Hóa đơn này sẽ bị xoá vĩnh viễn. Hành động không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huỷ</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            style={{ background: "#E11D48", color: "white" }}
          >
            {isPending ? "Đang xoá..." : "Xoá"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface BillsTableProps {
  bills: BillSummary[];
  studentId: number;
  isMobile: boolean;
}

export function BillsTable({ bills, studentId, isMobile }: BillsTableProps) {
  const router = useRouter();
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        border: "1px solid #F4D8DE",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2
          style={{ fontWeight: 700, fontSize: 16, color: "#2C1820", margin: 0 }}
        >
          Lịch sử hóa đơn
        </h2>
        <span style={{ fontSize: 13, color: "#A87888" }}>
          {bills.length} hóa đơn
        </span>
      </div>

      {bills.length === 0 ? (
        <p style={{ color: "#C4A0A8", fontSize: 14 }}>Chưa có hóa đơn</p>
      ) : isMobile ? (
        /* ── Mobile: card list ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bills.map((b) => {
            const attended =
              b.sessions?.filter((s) => s.isAttended).length ?? 0;
            const pct =
              b.sessionCount > 0
                ? Math.round((attended / b.sessionCount) * 100)
                : 0;
            const isPaid = b.status === "paid";
            return (
              <div
                key={b.id}
                onClick={() => router.push(`/bills/${b.id}`)}
                style={{
                  background: "white",
                  border: "1px solid #F4D8DE",
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                }}
              >
                {/* Top row: status badge + date + delete */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: isPaid ? "#DCFCE7" : "#FEF9C3",
                      color: isPaid ? "#16A34A" : "#A16207",
                    }}
                  >
                    {isPaid ? "Đã thu" : "Chưa thanh toán"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>
                      {b.startDate ? formatDateVN(b.startDate) : "—"}
                    </span>
                    <DeleteBillButton billId={b.id} studentId={studentId} />
                  </div>
                </div>
                {/* Bottom row: progress + amount */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 6,
                        background: "#F4D8DE",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "#6BA8F0",
                          borderRadius: 99,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>
                      {attended}/{b.sessionCount} buổi
                    </span>
                  </div>
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: "#2C1820" }}
                  >
                    {formatMoneyVND(b.totalAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Desktop: table ── */
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["NGÀY BẮT ĐẦU", "TIẾN ĐỘ", "SỐ TIỀN", "TRẠNG THÁI", "THAO TÁC"].map(
                (col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#C4A0A8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      paddingBottom: 12,
                      borderBottom: "1px solid #F4D8DE",
                    }}
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => {
              const attended =
                b.sessions?.filter((s) => s.isAttended).length ?? 0;
              const pct =
                b.sessionCount > 0
                  ? Math.round((attended / b.sessionCount) * 100)
                  : 0;
              const isPaid = b.status === "paid";
              return (
                <tr key={b.id} style={{ borderBottom: "1px solid #F9F0F2" }}>
                  <td
                    style={{
                      padding: "14px 0",
                      fontSize: 14,
                      color: "#2C1820",
                    }}
                  >
                    {b.startDate ? formatDateVN(b.startDate) : "—"}
                  </td>
                  <td style={{ padding: "14px 16px 14px 0" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 80,
                          height: 6,
                          background: "#F4D8DE",
                          borderRadius: 99,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "#6BA8F0",
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          color: "#6B7280",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {attended}/{b.sessionCount} buổi
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "14px 16px 14px 0",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#2C1820",
                    }}
                  >
                    {formatMoneyVND(b.totalAmount)}
                  </td>
                  <td style={{ padding: "14px 16px 14px 0" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: isPaid ? "#DCFCE7" : "#FEF9C3",
                        color: isPaid ? "#16A34A" : "#A16207",
                      }}
                    >
                      {isPaid ? "Đã thu" : "Chưa thanh toán"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Link
                        href={`/bills/${b.id}`}
                        style={{ fontSize: 13, fontWeight: 600, color: "#E8788A", textDecoration: "none" }}
                      >
                        Xem →
                      </Link>
                      <DeleteBillButton billId={b.id} studentId={studentId} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
