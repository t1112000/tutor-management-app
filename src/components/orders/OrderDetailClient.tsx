"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Copy, Trash2 } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QueryErrorState } from "@/components/ui/query-error";
import { useAccounts, type InventoryAccountListItem } from "@/hooks/queries/use-accounts";
import type { CustomerContact } from "@/hooks/queries/use-customers";
import {
  useOrder, useCopyOrderText, useReplaceOrderLine, useDeleteOrder,
  type OrderDetailLine,
} from "@/hooks/queries/use-order";
import { VN_TZ, formatDateVN, formatMoneyVND } from "@/lib/time";

const CONTACT_TYPES = [
  { type: "facebook" as const, label: "Facebook" },
  { type: "zalo" as const, label: "Zalo" },
  { type: "discord" as const, label: "Discord" },
  { type: "telegram" as const, label: "Telegram" },
];

const TYPE_LABELS: Record<InventoryAccountListItem["type"], string> = {
  netflix: "Netflix",
  gpt_plus: "GPT Plus",
};

const cardStyle: React.CSSProperties = {
  background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px",
};

const fieldLabel: React.CSSProperties = {
  fontSize: "11px", color: "#A87888", marginBottom: "4px",
};

const secondaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "6px", background: "#FFF8FA",
  border: "1px solid #F4D8DE", borderRadius: "8px", padding: "6px 12px",
  fontSize: "13px", color: "#6B4858", cursor: "pointer", fontFamily: "inherit",
};

function formatTimestampVN(iso: string): string {
  return formatDateVN(formatInTimeZone(new Date(iso), VN_TZ, "yyyy-MM-dd"));
}

function TypeBadge({ type }: { type: InventoryAccountListItem["type"] }) {
  const color = type === "netflix" ? "#E11D48" : "#16A34A";
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, color, background: `${color}1A`, borderRadius: "9999px", padding: "2px 8px" }}>
      {TYPE_LABELS[type]}
    </span>
  );
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
            {label}: {c.value.length > 20 ? `${c.value.slice(0, 20)}…` : c.value}
          </span>
        );
      })}
    </div>
  );
}

function warrantyText(line: OrderDetailLine): string {
  if (line.warrantyType === "kbh") return "KBH";
  const until = line.warrantyUntil ? formatDateVN(line.warrantyUntil) : null;
  if (line.warrantyType === "bhf") return until ? `BHF đến ${until}` : "BHF";
  const days = line.warrantyDays != null ? `${line.warrantyDays} ngày` : "Theo ngày";
  return until ? `${days} (đến ${until})` : days;
}

function SecretRow({ label, value }: { label: string; value: string | null }) {
  const [shown, setShown] = useState(false);
  if (!value) {
    return (
      <div>
        <div style={fieldLabel}>{label}</div>
        <div style={{ fontSize: "14px", color: "#2C1820" }}>—</div>
      </div>
    );
  }
  return (
    <div>
      <div style={fieldLabel}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "14px", color: "#2C1820", fontFamily: "monospace" }}>
          {shown ? value : "••••••••"}
        </span>
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer", color: "#E8788A",
            fontSize: "13px", fontWeight: 500, padding: 0, fontFamily: "inherit",
          }}
        >
          {shown ? "Ẩn" : "Hiện"}
        </button>
      </div>
    </div>
  );
}

function LineCard({
  line,
  copying,
  onCopyLine,
  onReplace,
}: {
  line: OrderDetailLine;
  copying: boolean;
  onCopyLine: () => void;
  onReplace: () => void;
}) {
  const acc = line.currentAccount;
  const history = line.assignments.filter((a) => a.replacedAt);
  const expired = !line.replaceAllowed && line.warrantyType !== "kbh";
  const canCopy = Boolean(acc);

  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "14px" }}>
      {acc ? (
        <>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, marginBottom: "4px" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {acc.email}
              </div>
              <TypeBadge type={acc.type} />
            </div>
            <div style={{ fontSize: "12px", color: "#A87888" }}>Hết hạn {formatDateVN(acc.expiryDate)}</div>
          </div>
          <SecretRow label="Mật khẩu" value={acc.password} />
          <SecretRow label="Mã 2FA" value={acc.twoFactorSecret} />
        </>
      ) : (
        <div style={{ fontSize: "14px", color: "#A87888" }}>—</div>
      )}

      <div>
        <div style={fieldLabel}>Bảo hành</div>
        <div style={{ fontSize: "14px", color: "#2C1820" }}>{warrantyText(line)}</div>
      </div>

      <div>
        <div style={fieldLabel}>Giá</div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820" }}>{formatMoneyVND(line.price)}</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          type="button"
          onClick={onCopyLine}
          disabled={!canCopy || copying}
          style={{
            ...secondaryBtn,
            cursor: canCopy && !copying ? "pointer" : "not-allowed",
            opacity: canCopy && !copying ? 1 : 0.6,
          }}
        >
          <Copy size={13} /> Copy dòng
        </button>
        {line.warrantyType !== "kbh" && (
          <span title={expired ? "Hết hạn bảo hành" : undefined} style={{ display: "inline-flex" }}>
            <button
              type="button"
              onClick={expired ? undefined : onReplace}
              disabled={expired}
              title={expired ? "Hết hạn bảo hành" : undefined}
              style={{
                ...secondaryBtn,
                cursor: expired ? "not-allowed" : "pointer",
                opacity: expired ? 0.6 : 1,
              }}
            >
              Đổi tài khoản
            </button>
          </span>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <div style={{ ...fieldLabel, marginBottom: "8px" }}>Lịch sử</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {history.map((a) => (
              <div key={a.id} style={{ fontSize: "13px", color: "#6B4858" }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.account.email}</div>
                <div style={{ fontSize: "12px", color: "#A87888" }}>
                  {formatTimestampVN(a.assignedAt)}
                  {a.replacedAt ? ` → ${formatTimestampVN(a.replacedAt)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  orderId: number;
}

export default function OrderDetailClient({ orderId }: Props) {
  const router = useRouter();
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);
  const { data: available = [] } = useAccounts("available");
  const copyText = useCopyOrderText(orderId);
  const replaceMut = useReplaceOrderLine(orderId);
  const { mutate: deleteOrder, isPending: deleting } = useDeleteOrder(orderId);

  const [replaceLine, setReplaceLine] = useState<OrderDetailLine | null>(null);
  const [pickedAccountId, setPickedAccountId] = useState<number | null>(null);

  if (isLoading) return <div style={{ padding: "32px", textAlign: "center", color: "#A87888" }}>Đang tải...</div>;
  if (isError || !order) return <QueryErrorState message="Không tải được đơn hàng" onRetry={() => refetch()} />;

  const candidates = available.filter((a) => a.id !== replaceLine?.currentAccount?.id);

  async function copyAll() {
    try {
      const { text } = await copyText.mutateAsync(undefined);
      await navigator.clipboard.writeText(text);
      toast.success("Đã copy đơn");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Copy thất bại");
    }
  }

  async function copyLine(accountId: number) {
    try {
      const { text } = await copyText.mutateAsync([accountId]);
      await navigator.clipboard.writeText(text);
      toast.success("Đã copy tài khoản");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Copy thất bại");
    }
  }

  function openReplace(line: OrderDetailLine) {
    setPickedAccountId(null);
    setReplaceLine(line);
  }

  function onReplaceOpenChange(open: boolean) {
    if (open) return;
    setReplaceLine(null);
    setPickedAccountId(null);
  }

  async function confirmReplace() {
    if (!replaceLine || pickedAccountId == null) {
      toast.error("Chọn tài khoản");
      return;
    }
    try {
      await replaceMut.mutateAsync({ lineId: replaceLine.id, accountId: pickedAccountId });
      toast.success("Đã đổi tài khoản");
      setReplaceLine(null);
      setPickedAccountId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đổi tài khoản thất bại");
    }
  }

  function remove() {
    deleteOrder(undefined, {
      onSuccess: () => { toast.success("Đã xoá đơn"); router.push("/orders"); },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Xoá thất bại"),
    });
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div style={{ padding: "24px 32px", maxWidth: "560px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", gap: "8px" }}>
          <button
            type="button"
            onClick={() => router.push("/orders")}
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#6B4858", cursor: "pointer", fontSize: "14px", padding: 0, fontFamily: "inherit" }}
          >
            <ChevronLeft size={16} /> Đơn hàng
          </button>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button type="button" onClick={copyAll} disabled={copyText.isPending} style={{ ...secondaryBtn, opacity: copyText.isPending ? 0.7 : 1 }}>
              <Copy size={13} /> Copy cả đơn
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", background: "#FEF2F2",
                    border: "1px solid #FCA5A5", borderRadius: "8px", padding: "6px 12px",
                    fontSize: "13px", color: "#dc2626", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <Trash2 size={13} /> Xóa đơn
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa đơn?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Xóa đơn sẽ trả tài khoản đang gắn về Còn hàng; acc đã đổi giữ Đã bán.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                  <AlertDialogAction onClick={remove} disabled={deleting} style={{ background: "#E11D48", color: "white" }}>
                    {deleting ? "Đang xoá..." : "Xóa đơn"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: "16px" }}>
          <Link
            href={`/customers/${order.customer.id}`}
            style={{ fontSize: "20px", fontWeight: 600, color: "#2C1820", textDecoration: "none" }}
          >
            {order.customer.name}
          </Link>
          <div style={{ marginTop: "10px" }}>
            <ContactChips contacts={order.customer.contacts} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "#2C1820" }}>{formatMoneyVND(order.totalPrice)}</span>
            <span style={{ fontSize: "13px", color: "#6B4858" }}>{formatTimestampVN(order.createdAt)}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {order.lines.map((line) => (
            <LineCard
              key={line.id}
              line={line}
              copying={copyText.isPending}
              onCopyLine={() => {
                if (!line.currentAccount) return;
                void copyLine(line.currentAccount.id);
              }}
              onReplace={() => openReplace(line)}
            />
          ))}
        </div>
      </div>

      <Dialog open={replaceLine != null} onOpenChange={onReplaceOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tài khoản</DialogTitle>
          </DialogHeader>
          {candidates.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Không có tài khoản còn hàng</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "50vh", overflowY: "auto" }}>
              {candidates.map((a) => {
                const selected = pickedAccountId === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setPickedAccountId(a.id)}
                    style={{
                      background: selected ? "rgba(232,120,138,0.08)" : "#FFF8FA",
                      border: selected ? "1px solid rgba(232,120,138,0.4)" : "1px solid #F4D8DE",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <TypeBadge type={a.type} />
                      <span style={{ fontSize: "12px", color: "#A87888" }}>Hết hạn {formatDateVN(a.expiryDate)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => void confirmReplace()}
            disabled={pickedAccountId == null || replaceMut.isPending || candidates.length === 0}
            style={{
              background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "12px 0",
              fontSize: "14px",
              fontWeight: 600,
              cursor: pickedAccountId == null || replaceMut.isPending || candidates.length === 0 ? "not-allowed" : "pointer",
              opacity: pickedAccountId == null || replaceMut.isPending || candidates.length === 0 ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {replaceMut.isPending ? "Đang đổi..." : "Xác nhận"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
