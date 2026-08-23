"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useImportAccounts } from "@/hooks/queries/use-accounts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px",
};

export default function ImportAccountsDialog({ open, onOpenChange, onImported }: Props) {
  const [type, setType] = useState<"netflix" | "gpt_plus">("netflix");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const { mutate: importAccounts, isPending: saving } = useImportAccounts();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    if (!text.trim()) { toast.error("Danh sách không được trống"); return; }

    importAccounts(
      { type, text },
      {
        onSuccess: (res) => {
          toast.success(`Đã import ${res.created} tài khoản`);
          setText("");
          onImported();
        },
        onError: (err) => setErrors(err.message.split("; ")),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import hàng loạt</DialogTitle>
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
            <label style={labelStyle}>
              Danh sách (mỗi dòng: email|mật khẩu|2fa|ngày hết hạn)
            </label>
            <p style={{ fontSize: "11px", color: "#A87888", marginBottom: "6px", fontFamily: "monospace" }}>
              user1@gmail.com|Pass123|ABCD1234|2027-01-15
            </p>
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"user1@gmail.com|Pass123|ABCD1234|2027-01-15\nuser2@gmail.com|Pass456||2027-02-20"}
              style={{ fontFamily: "monospace", fontSize: "13px" }}
            />
          </div>

          {errors.length > 0 && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "10px 12px" }}>
              {errors.map((err, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#dc2626" }}>{err}</div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={() => onOpenChange(false)} style={{ flex: 1, background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "10px 0", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              Hủy
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "10px 0", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Đang import..." : "Import"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
