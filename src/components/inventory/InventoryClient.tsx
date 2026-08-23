"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { QueryErrorState } from "@/components/ui/query-error";
import useIsMobile from "@/hooks/use-is-mobile";
import { useAccounts, type InventoryAccount } from "@/hooks/queries/use-accounts";
import { buildAccountCopyText } from "@/lib/accountCopyText";
import AddAccountDialog from "./AddAccountDialog";
import ImportAccountsDialog from "./ImportAccountsDialog";

const TYPE_LABELS: Record<InventoryAccount["type"], string> = {
  netflix: "Netflix",
  gpt_plus: "GPT Plus",
};

const STATUS_LABELS: Record<InventoryAccount["status"], string> = {
  available: "Còn hàng",
  sold: "Đã bán",
};

function TypeBadge({ type }: { type: InventoryAccount["type"] }) {
  const color = type === "netflix" ? "#E11D48" : "#16A34A";
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, color, background: `${color}1A`, borderRadius: "9999px", padding: "2px 8px" }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

function StatusBadge({ status }: { status: InventoryAccount["status"] }) {
  const color = status === "available" ? "#2E7D32" : "#A87888";
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, color, background: `${color}1A`, borderRadius: "9999px", padding: "2px 8px" }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function InventoryClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<"available" | "sold" | "all">("available");
  const [type, setType] = useState<"" | "netflix" | "gpt_plus">("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: accounts = [], isLoading: loading, isError, refetch } = useAccounts(status, type);

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function copySelected() {
    const chosen = accounts.filter((a) => selected.has(a.id));
    if (chosen.length === 0) return;
    await navigator.clipboard.writeText(buildAccountCopyText(chosen));
    toast.success(`Đã copy ${chosen.length} tài khoản`);
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div style={{ height: "64px", padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#2C1820", margin: 0 }}>Kho tài khoản</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowImport(true)}
            style={{ background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "10px", padding: "9px 16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
          >
            Import hàng loạt
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "9px 16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
          >
            + Thêm tài khoản
          </button>
        </div>
      </div>

      <div style={{ padding: isMobile ? "16px" : "24px 32px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {(["available", "sold", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setSelected(new Set()); }}
              style={{
                padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", cursor: "pointer",
                ...(status === s
                  ? { background: "rgba(232,120,138,0.12)", color: "#E8788A", border: "1px solid rgba(232,120,138,0.3)", fontWeight: 600 }
                  : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 }),
              }}
            >
              {s === "available" ? "Còn hàng" : s === "sold" ? "Đã bán" : "Tất cả"}
            </button>
          ))}
          <span style={{ width: "1px", background: "#F4D8DE", margin: "0 4px" }} />
          {(["", "netflix", "gpt_plus"] as const).map((t) => (
            <button
              key={t || "all-types"}
              onClick={() => { setType(t); setSelected(new Set()); }}
              style={{
                padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", cursor: "pointer",
                ...(type === t
                  ? { background: "rgba(232,120,138,0.12)", color: "#E8788A", border: "1px solid rgba(232,120,138,0.3)", fontWeight: 600 }
                  : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 }),
              }}
            >
              {t === "" ? "Tất cả loại" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "10px 16px", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "#6B4858" }}>Đã chọn {selected.size} tài khoản</span>
            <button
              onClick={copySelected}
              style={{ background: "#E8788A", color: "white", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            >
              Copy đã chọn ({selected.size})
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Đang tải...</div>
        ) : isError ? (
          <QueryErrorState message="Không tải được kho tài khoản" onRetry={() => refetch()} compact />
        ) : !accounts.length ? (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Chưa có tài khoản nào</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {accounts.map((a) => (
              <div
                key={a.id}
                style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelected(a.id)} onClick={(e) => e.stopPropagation()} />
                <div
                  onClick={() => router.push(`/inventory/${a.id}`)}
                  style={{ flex: 1, minWidth: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <TypeBadge type={a.type} />
                      <StatusBadge status={a.status} />
                      <span style={{ fontSize: "12px", color: "#A87888" }}>Hết hạn {a.expiryDate}</span>
                      {a.type === "gpt_plus" && a.quotaPercent !== null && (
                        <span style={{ fontSize: "12px", color: "#A87888" }}>Quota {a.quotaPercent}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddAccountDialog open={showAdd} onOpenChange={setShowAdd} onCreated={() => setShowAdd(false)} />
      <ImportAccountsDialog open={showImport} onOpenChange={setShowImport} onImported={() => setShowImport(false)} />
    </div>
  );
}
