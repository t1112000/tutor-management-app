"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { useCreateAccount } from "@/hooks/queries/use-accounts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#FFF8FA", border: "1px solid #F4D8DE",
  borderRadius: "12px", padding: "9px 12px", fontSize: "14px",
  color: "#2C1820", outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px",
};

export default function AddAccountDialog({ open, onOpenChange, onCreated }: Props) {
  const [type, setType] = useState<"netflix" | "gpt_plus">("netflix");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quotaPercent, setQuotaPercent] = useState("");
  const [notes, setNotes] = useState("");
  const { mutate: createAccount, isPending: saving } = useCreateAccount();

  function reset() {
    setType("netflix"); setEmail(""); setPassword(""); setTwoFactorSecret("");
    setExpiryDate(""); setQuotaPercent(""); setNotes("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("Email không được trống"); return; }
    if (!password.trim()) { toast.error("Mật khẩu không được trống"); return; }
    if (!expiryDate) { toast.error("Chọn ngày hết hạn"); return; }

    createAccount(
      {
        type, email: email.trim(), password,
        twoFactorSecret: twoFactorSecret.trim() || undefined,
        expiryDate,
        quotaPercent: type === "gpt_plus" && quotaPercent ? Number(quotaPercent) : undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => { toast.success("Đã thêm tài khoản"); reset(); onCreated(); },
        onError: () => toast.error("Thêm tài khoản thất bại"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm tài khoản mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ ...labelStyle, marginBottom: "8px" }}>Loại tài khoản</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["netflix", "gpt_plus"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
                    ...(type === t
                      ? { background: "rgba(232,120,138,0.12)", color: "#E8788A", border: "1px solid rgba(232,120,138,0.3)", fontWeight: 600 }
                      : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 }),
                  }}
                >
                  {t === "netflix" ? "Netflix" : "GPT Plus"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inputStyle} type="email" placeholder="user@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Mật khẩu <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inputStyle} type="text" placeholder="Mật khẩu tài khoản" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Mã 2FA (tuỳ chọn)</label>
            <input style={inputStyle} type="text" placeholder="ABCD1234" value={twoFactorSecret} onChange={(e) => setTwoFactorSecret(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Ngày hết hạn <span style={{ color: "#dc2626" }}>*</span></label>
            <DatePicker value={expiryDate} onChange={setExpiryDate} />
          </div>

          {type === "gpt_plus" && (
            <div>
              <label style={labelStyle}>Quota (%)</label>
              <input style={inputStyle} type="number" min={0} max={100} placeholder="100" value={quotaPercent} onChange={(e) => setQuotaPercent(e.target.value)} />
            </div>
          )}

          <div>
            <label style={labelStyle}>Ghi chú</label>
            <input style={inputStyle} type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={() => onOpenChange(false)} style={{ flex: 1, background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "10px 0", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              Hủy
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "10px 0", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Đang lưu..." : "Thêm tài khoản"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
