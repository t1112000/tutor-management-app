"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { QueryErrorState } from "@/components/ui/query-error";
import useIsMobile from "@/hooks/use-is-mobile";
import { useCustomers } from "@/hooks/queries/use-customers";
import { useOrders, type OrderListLine } from "@/hooks/queries/use-orders";
import { VN_TZ, formatDateVN, formatMoneyVND, todayVN } from "@/lib/time";

function formatOrderDate(createdAt: string): string {
  return formatDateVN(formatInTimeZone(new Date(createdAt), VN_TZ, "yyyy-MM-dd"));
}

function currentEmailsLabel(lines: OrderListLine[]): string {
  const emails = lines
    .map((l) => l.currentAccount?.email)
    .filter((e): e is string => Boolean(e));
  if (emails.length === 0) return "—";
  if (emails.length > 2) return `${emails[0]}, ${emails.length} tài khoản`;
  return emails.join(", ");
}

function warrantyLabel(line: OrderListLine): string {
  if (line.warrantyType === "kbh") return "KBH";
  if (line.warrantyUntil != null && line.warrantyUntil >= todayVN()) return "Còn hạn";
  return "Hết hạn";
}

function WarrantyChip({ line }: { line: OrderListLine }) {
  const label = warrantyLabel(line);
  const color = label === "Còn hạn" ? "#2E7D32" : label === "Hết hạn" ? "#C45656" : "#A87888";
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color,
        background: `${color}1A`,
        borderRadius: "9999px",
        padding: "2px 8px",
      }}
    >
      {label}
    </span>
  );
}

function WarrantyChips({ lines }: { lines: OrderListLine[] }) {
  if (!lines.length) {
    return <span style={{ fontSize: "13px", color: "#A87888" }}>—</span>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {lines.map((line) => (
        <WarrantyChip key={line.id} line={line} />
      ))}
    </div>
  );
}

export default function OrdersClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [customerId, setCustomerId] = useState("");

  const { data: customers = [] } = useCustomers();
  const { data: orders = [], isLoading: loading, isError, refetch } = useOrders(customerId);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div style={{ height: "64px", padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#2C1820", margin: 0 }}>Đơn hàng</h1>
        <button
          onClick={() => router.push("/orders/new")}
          style={{ background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
        >
          + Tạo đơn
        </button>
      </div>

      <div style={{ padding: isMobile ? "16px" : "24px 32px" }}>
        <div style={{ marginBottom: "18px", display: "flex", gap: "12px" }}>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{
              maxWidth: isMobile ? "none" : "340px",
              flex: 1,
              background: "#FFF8FA",
              border: "1px solid #F4D8DE",
              borderRadius: "12px",
              padding: "9px 12px",
              fontSize: "14px",
              color: "#2C1820",
              outline: "none",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="">Tất cả khách</option>
            {customers.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Đang tải...</div>
        ) : isError ? (
          <QueryErrorState message="Không tải được danh sách đơn hàng" onRetry={() => refetch()} compact />
        ) : !orders.length ? (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Chưa có đơn hàng</div>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => router.push(`/orders/${o.id}`)}
                style={{
                  background: "white", border: "1px solid #F4D8DE", borderRadius: "12px",
                  padding: "14px 16px", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer.name}</div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", flexShrink: 0 }}>{formatMoneyVND(o.totalPrice)}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#6B4858", marginBottom: "8px" }}>{formatOrderDate(o.createdAt)}</div>
                <div style={{ fontSize: "13px", color: "#A87888", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentEmailsLabel(o.lines)}</div>
                <WarrantyChips lines={o.lines} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FFF8FA" }}>
                  {["Ngày", "Khách", "Tài khoản", "Tổng", "Bảo hành"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/orders/${o.id}`)}
                    style={{ borderTop: "1px solid #F4D8DE", cursor: "pointer", transition: "background 120ms ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF8FA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 16px", fontSize: "13px", color: "#6B4858", whiteSpace: "nowrap" }}>{formatOrderDate(o.createdAt)}</td>
                    <td style={{ padding: "13px 16px", fontSize: "14px", fontWeight: 500, color: "#2C1820" }}>{o.customer.name}</td>
                    <td style={{ padding: "13px 16px", fontSize: "13px", color: "#6B4858" }}>{currentEmailsLabel(o.lines)}</td>
                    <td style={{ padding: "13px 16px", fontSize: "14px", fontWeight: 600, color: "#2C1820", whiteSpace: "nowrap" }}>{formatMoneyVND(o.totalPrice)}</td>
                    <td style={{ padding: "13px 16px" }}><WarrantyChips lines={o.lines} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
