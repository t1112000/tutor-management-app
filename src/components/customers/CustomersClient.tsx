"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QueryErrorState } from "@/components/ui/query-error";
import useIsMobile from "@/hooks/use-is-mobile";
import { useCustomers, type CustomerContact } from "@/hooks/queries/use-customers";
import AddCustomerDialog from "./AddCustomerDialog";

const CONTACT_TYPES = [
  { type: "facebook" as const, label: "Facebook" },
  { type: "zalo" as const, label: "Zalo" },
  { type: "discord" as const, label: "Discord" },
  { type: "telegram" as const, label: "Telegram" },
];

function truncate(value: string, max = 20): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function ContactChips({ contacts }: { contacts: CustomerContact[] }) {
  if (!contacts.length) {
    return <span style={{ fontSize: "13px", color: "#A87888" }}>—</span>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {contacts.map((c) => {
        const label = CONTACT_TYPES.find((t) => t.type === c.type)?.label ?? c.type;
        return (
          <span
            key={c.id}
            style={{
              fontSize: "11px",
              color: "#A87888",
              background: "#FFF8FA",
              border: "1px solid #F4D8DE",
              borderRadius: 9999,
              padding: "2px 8px",
            }}
          >
            {label}: {truncate(c.value)}
          </span>
        );
      })}
    </div>
  );
}

export default function CustomersClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: customers = [], isLoading: loading, isError, refetch } = useCustomers(q);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div style={{ height: "64px", padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#2C1820", margin: 0 }}>Khách hàng</h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{ background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
        >
          + Thêm khách
        </button>
      </div>

      <div style={{ padding: isMobile ? "16px" : "24px 32px" }}>
        <div style={{ marginBottom: "18px", display: "flex", gap: "12px" }}>
          <div style={{ position: "relative", maxWidth: isMobile ? "none" : "340px", flex: 1 }}>
            <svg style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9098a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: "100%", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "9px 12px 9px 34px", fontSize: "14px", color: "#2C1820", outline: "none", fontFamily: "inherit" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Đang tải...</div>
        ) : isError ? (
          <QueryErrorState message="Không tải được danh sách khách hàng" onRetry={() => refetch()} compact />
        ) : !customers.length ? (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Chưa có khách hàng</div>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/customers/${c.id}`)}
                style={{
                  background: "white", border: "1px solid #F4D8DE", borderRadius: "12px",
                  padding: "14px 16px", cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "8px" }}>{c.name}</div>
                <ContactChips contacts={c.contacts} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FFF8FA" }}>
                  {["Tên", "Liên hệ"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/customers/${c.id}`)}
                    style={{ borderTop: "1px solid #F4D8DE", cursor: "pointer", transition: "background 120ms ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF8FA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 16px", fontSize: "14px", fontWeight: 500, color: "#2C1820" }}>{c.name}</td>
                    <td style={{ padding: "13px 16px" }}><ContactChips contacts={c.contacts} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddCustomerDialog open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}
