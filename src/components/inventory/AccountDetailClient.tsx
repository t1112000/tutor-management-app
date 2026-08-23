"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QueryErrorState } from "@/components/ui/query-error";
import { useAccount, useUpdateAccount, useDeleteAccount } from "@/hooks/queries/use-account";
import { buildAccountCopyText } from "@/lib/accountCopyText";

const TYPE_LABELS = { netflix: "Netflix", gpt_plus: "GPT Plus" } as const;
const STATUS_LABELS = { available: "Còn hàng", sold: "Đã bán" } as const;

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#FFF8FA", border: "1px solid #F4D8DE",
  borderRadius: "10px", padding: "8px 10px", fontSize: "14px",
  color: "#2C1820", outline: "none", fontFamily: "inherit",
};

interface Props {
  accountId: number;
}

export default function AccountDetailClient({ accountId }: Props) {
  const router = useRouter();
  const { data: account, isLoading, isError, refetch } = useAccount(accountId);
  const { mutate: updateAccount, isPending: saving } = useUpdateAccount(accountId);
  const { mutate: deleteAccount, isPending: deleting } = useDeleteAccount(accountId);

  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", twoFactorSecret: "", expiryDate: "", quotaPercent: "", notes: "", status: "available" as "available" | "sold" });

  if (isLoading) return <div style={{ padding: "32px", textAlign: "center", color: "#A87888" }}>Đang tải...</div>;
  if (isError || !account) return <QueryErrorState message="Không tải được tài khoản" onRetry={() => refetch()} />;

  function startEdit() {
    if (!account) return;
    setForm({
      email: account.email,
      password: account.password,
      twoFactorSecret: account.twoFactorSecret ?? "",
      expiryDate: account.expiryDate,
      quotaPercent: account.quotaPercent !== null ? String(account.quotaPercent) : "",
      notes: account.notes ?? "",
      status: account.status,
    });
    setEditing(true);
  }

  function save() {
    updateAccount(
      {
        email: form.email.trim(),
        password: form.password,
        twoFactorSecret: form.twoFactorSecret.trim() || null,
        expiryDate: form.expiryDate,
        quotaPercent: account?.type === "gpt_plus" && form.quotaPercent ? Number(form.quotaPercent) : null,
        status: form.status,
        notes: form.notes.trim() || null,
      },
      {
        onSuccess: () => { toast.success("Đã lưu"); setEditing(false); },
        onError: () => toast.error("Lưu thất bại"),
      }
    );
  }

  async function copy() {
    if (!account) return;
    await navigator.clipboard.writeText(buildAccountCopyText([account]));
    toast.success("Đã copy tài khoản");
  }

  function remove() {
    deleteAccount(undefined, {
      onSuccess: () => { toast.success("Đã xoá tài khoản"); router.push("/inventory"); },
      onError: () => toast.error("Xoá thất bại"),
    });
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: "560px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button onClick={() => router.push("/inventory")} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#6B4858", cursor: "pointer", fontSize: "14px" }}>
          <ChevronLeft size={16} /> Kho tài khoản
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", color: "#6B4858", cursor: "pointer" }}>
            <Copy size={13} /> Copy
          </button>
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
                <AlertDialogTitle>Xoá tài khoản?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tài khoản {account.email} sẽ bị xoá. Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction onClick={remove} disabled={deleting} style={{ background: "#E11D48", color: "white" }}>
                  {deleting ? "Đang xoá..." : "Xoá tài khoản"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Loại</div>
          <div style={{ fontSize: "14px", color: "#2C1820" }}>{TYPE_LABELS[account.type]}</div>
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Trạng thái</div>
          {editing ? (
            <div style={{ display: "flex", gap: "8px" }}>
              {(["available", "sold"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
                    ...(form.status === s
                      ? { background: "rgba(232,120,138,0.12)", color: "#E8788A", border: "1px solid rgba(232,120,138,0.3)", fontWeight: 600 }
                      : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 }),
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820" }}>{STATUS_LABELS[account.status]}</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Email</div>
          {editing ? (
            <input style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820" }}>{account.email}</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Mật khẩu</div>
          {editing ? (
            <input style={inputStyle} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#2C1820", fontFamily: "monospace" }}>
                {revealed ? account.password : "••••••••"}
              </span>
              <button onClick={() => setRevealed((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A87888" }}>
                {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Mã 2FA</div>
          {editing ? (
            <input style={inputStyle} value={form.twoFactorSecret} onChange={(e) => setForm({ ...form, twoFactorSecret: e.target.value })} placeholder="Không có" />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820", fontFamily: "monospace" }}>{account.twoFactorSecret ?? "—"}</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Ngày hết hạn</div>
          {editing ? (
            <DatePicker value={form.expiryDate} onChange={(v) => setForm({ ...form, expiryDate: v })} />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820" }}>{account.expiryDate}</div>
          )}
        </div>

        {account.type === "gpt_plus" && (
          <div>
            <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Quota còn lại (%)</div>
            {editing ? (
              <input style={inputStyle} type="number" min={0} max={100} value={form.quotaPercent} onChange={(e) => setForm({ ...form, quotaPercent: e.target.value })} />
            ) : (
              <div style={{ fontSize: "14px", color: "#2C1820" }}>{account.quotaPercent ?? "—"}</div>
            )}
          </div>
        )}

        <div>
          <div style={{ fontSize: "11px", color: "#A87888", marginBottom: "4px" }}>Ghi chú</div>
          {editing ? (
            <input style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          ) : (
            <div style={{ fontSize: "14px", color: "#2C1820" }}>{account.notes ?? "—"}</div>
          )}
        </div>

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
    </div>
  );
}
