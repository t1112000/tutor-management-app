"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateCustomer, type CustomerContactType } from "@/hooks/queries/use-customers";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

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
  borderRadius: "12px", padding: "9px 12px", fontSize: "14px",
  color: "#2C1820", outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px",
};

export default function AddCustomerDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState(EMPTY_CONTACTS);
  const { mutate: createCustomer, isPending: saving } = useCreateCustomer();

  function reset() {
    setName("");
    setNotes("");
    setContacts(EMPTY_CONTACTS);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Tên khách không được trống"); return; }

    createCustomer(
      {
        name: name.trim(),
        notes: notes.trim() || undefined,
        contacts: CONTACT_TYPES
          .map(({ type }) => ({ type, value: contacts[type].trim() }))
          .filter((c) => c.value !== ""),
      },
      {
        onSuccess: () => { toast.success("Đã thêm khách"); reset(); onOpenChange(false); },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Thêm khách thất bại"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm khách hàng</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Tên <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inputStyle} type="text" placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Ghi chú</label>
            <input style={inputStyle} type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
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

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={() => onOpenChange(false)} style={{ flex: 1, background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "10px 0", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              Hủy
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "10px 0", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Đang lưu..." : "Thêm khách"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
