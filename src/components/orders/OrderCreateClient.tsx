"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { QueryErrorState } from "@/components/ui/query-error";
import { useCustomers, type CustomerContactType } from "@/hooks/queries/use-customers";
import { useAccounts, type InventoryAccountListItem } from "@/hooks/queries/use-accounts";
import { useCreateOrder, type OrderCreateInput } from "@/hooks/queries/use-orders";

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

const TYPE_LABELS: Record<InventoryAccountListItem["type"], string> = {
  netflix: "Netflix",
  gpt_plus: "GPT Plus",
};

const WARRANTY_OPTIONS = [
  { type: "kbh" as const, label: "Không BH" },
  { type: "bhf" as const, label: "BHF" },
  { type: "days" as const, label: "Theo ngày" },
];

type WarrantyType = "kbh" | "bhf" | "days";
type CustomerMode = "existing" | "new";

interface LineDraft {
  warrantyType: WarrantyType;
  warrantyDays: string;
  price: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#FFF8FA", border: "1px solid #F4D8DE",
  borderRadius: "12px", padding: "9px 12px", fontSize: "14px",
  color: "#2C1820", outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px",
};

const cardStyle: React.CSSProperties = {
  background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px",
};

function TypeBadge({ type }: { type: InventoryAccountListItem["type"] }) {
  const color = type === "netflix" ? "#E11D48" : "#16A34A";
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, color, background: `${color}1A`, borderRadius: "9999px", padding: "2px 8px" }}>
      {TYPE_LABELS[type]}
    </span>
  );
}

function defaultLine(): LineDraft {
  return { warrantyType: "kbh", warrantyDays: "30", price: "0" };
}

function parsePrice(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return 0;
  const n = Number(t);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function parseDays(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function toggleBtnStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "8px 0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    ...(active
      ? { background: "rgba(232,120,138,0.12)", color: "#E8788A", border: "1px solid rgba(232,120,138,0.3)", fontWeight: 600 }
      : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 }),
  };
}

export default function OrderCreateClient() {
  const router = useRouter();
  const { data: customers = [] } = useCustomers();
  const { data: accounts = [], isLoading: loadingAccounts, isError, refetch } = useAccounts("available");
  const { mutateAsync: createOrder, isPending: saving } = useCreateOrder();

  const [customerMode, setCustomerMode] = useState<CustomerMode>("existing");
  const [customerId, setCustomerId] = useState("");
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [contacts, setContacts] = useState(EMPTY_CONTACTS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [lines, setLines] = useState<Record<number, LineDraft>>({});

  const hasCustomer = customerMode === "existing" ? customerId !== "" : newName.trim() !== "";
  const canSubmit = hasCustomer && selectedIds.length > 0 && !saving;

  function toggleSelected(id: number) {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      setLines((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setSelectedIds((prev) => [...prev, id]);
      setLines((prev) => ({ ...prev, [id]: prev[id] ?? defaultLine() }));
    }
  }

  function updateLine(id: number, patch: Partial<LineDraft>) {
    setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (customerMode === "new" && !newName.trim()) {
      toast.error("Tên khách không được trống");
      return;
    }

    const linesPayload: OrderCreateInput["lines"] = [];
    for (const id of selectedIds) {
      const line = lines[id];
      if (!line) continue;
      const price = parsePrice(line.price);
      if (price == null) {
        toast.error("Giá phải là số nguyên ≥ 0");
        return;
      }
      if (line.warrantyType === "days") {
        const days = parseDays(line.warrantyDays);
        if (days == null) {
          toast.error("Chọn số ngày bảo hành");
          return;
        }
        linesPayload.push({ accountId: id, warrantyType: "days", warrantyDays: days, price });
      } else {
        linesPayload.push({ accountId: id, warrantyType: line.warrantyType, price });
      }
    }
    if (linesPayload.length === 0) return;

    const body: OrderCreateInput =
      customerMode === "existing"
        ? { customerId: Number(customerId), lines: linesPayload }
        : {
            customer: {
              name: newName.trim(),
              notes: newNotes.trim() || undefined,
              contacts: CONTACT_TYPES
                .map(({ type }) => ({ type, value: contacts[type].trim() }))
                .filter((c) => c.value !== ""),
            },
            lines: linesPayload,
          };

    try {
      const created = await createOrder(body);
      toast.success("Đã tạo đơn");
      router.push(`/orders/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tạo đơn thất bại");
    }
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div style={{ padding: "24px 32px", maxWidth: "720px" }}>
        <button
          type="button"
          onClick={() => router.push("/orders")}
          style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#6B4858", cursor: "pointer", fontSize: "14px", marginBottom: "16px", padding: 0 }}
        >
          <ChevronLeft size={16} /> Đơn hàng
        </button>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#2C1820", margin: "0 0 20px" }}>Tạo đơn</h1>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={cardStyle}>
            <h2 style={{ fontWeight: 600, fontSize: "16px", color: "#2C1820", margin: "0 0 16px" }}>Khách hàng</h2>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <button type="button" onClick={() => setCustomerMode("existing")} style={toggleBtnStyle(customerMode === "existing")}>
                Khách có sẵn
              </button>
              <button type="button" onClick={() => setCustomerMode("new")} style={toggleBtnStyle(customerMode === "new")}>
                Khách mới
              </button>
            </div>

            {customerMode === "existing" ? (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Chọn khách</option>
                {customers.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={labelStyle}>Tên <span style={{ color: "#dc2626" }}>*</span></label>
                  <input style={inputStyle} type="text" placeholder="Nguyễn Văn A" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Ghi chú</label>
                  <input style={inputStyle} type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
                </div>
                {CONTACT_TYPES.map(({ type, label }) => (
                  <div key={type}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      style={inputStyle}
                      type="text"
                      value={contacts[type]}
                      onChange={(e) => setContacts((prev) => ({ ...prev, [type]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontWeight: 600, fontSize: "16px", color: "#2C1820", margin: "0 0 16px" }}>Tài khoản</h2>
            {loadingAccounts ? (
              <div style={{ padding: "16px 0", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Đang tải...</div>
            ) : isError ? (
              <QueryErrorState message="Không tải được kho tài khoản" onRetry={() => refetch()} compact />
            ) : !accounts.length ? (
              <div style={{ padding: "16px 0", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Chưa có tài khoản nào</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => toggleSelected(a.id)}
                    style={{ background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
                  >
                    <Checkbox
                      checked={selectedIds.includes(a.id)}
                      onCheckedChange={() => toggleSelected(a.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <TypeBadge type={a.type} />
                        <span style={{ fontSize: "12px", color: "#A87888" }}>Hết hạn {a.expiryDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedIds.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                {selectedIds.map((id) => {
                  const account = accounts.find((a) => a.id === id);
                  const line = lines[id];
                  if (!line) return null;
                  return (
                    <div key={id} style={{ background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {account?.email ?? `Tài khoản #${id}`}
                        </div>
                        {account && <TypeBadge type={account.type} />}
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        {WARRANTY_OPTIONS.map((opt) => (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => updateLine(id, { warrantyType: opt.type })}
                            style={toggleBtnStyle(line.warrantyType === opt.type)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {line.warrantyType === "days" && (
                          <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Số ngày</label>
                            <input
                              style={inputStyle}
                              type="number"
                              min={1}
                              step={1}
                              value={line.warrantyDays}
                              onChange={(e) => updateLine(id, { warrantyDays: e.target.value })}
                            />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>Giá (đ)</label>
                          <input
                            style={inputStyle}
                            type="number"
                            min={0}
                            step={1}
                            value={line.price}
                            onChange={(e) => updateLine(id, { price: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "12px 0",
              fontSize: "14px",
              fontWeight: 600,
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.7,
            }}
          >
            {saving ? "Đang tạo..." : "Tạo đơn"}
          </button>
        </form>
      </div>
    </div>
  );
}
