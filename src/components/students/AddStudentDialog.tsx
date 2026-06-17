"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function AddStudentDialog({ open, onOpenChange, onCreated }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", subject: "english", address: "", type: "offline" });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Tên học sinh không được trống"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, birthday: "", notes: "", parentName: "", parentPhone: "" }),
      });
      if (!res.ok) { toast.error("Thêm học sinh thất bại"); return; }
      const student = await res.json();
      toast.success("Đã thêm học sinh");
      onCreated();
      router.push(`/students/${student.id}`);
    } finally {
      setSaving(false);
    }
  }

  const isEnglish = form.subject === "english";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm học sinh mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>
              Họ và tên <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={(e) => { e.target.style.borderColor = "#E8788A"; e.target.style.boxShadow = "0 0 0 3px rgba(232,120,138,0.20)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#F4D8DE"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Subject toggle */}
          <div>
            <label style={{ ...labelStyle, marginBottom: "8px" }}>Môn học</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, subject: "english" })}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
                  ...(isEnglish
                    ? { background: "rgba(59,111,212,0.12)", color: "#3b6fd4", border: "1px solid rgba(59,111,212,0.25)", fontWeight: 600 }
                    : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 })
                }}
              >
                Tiếng Anh
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, subject: "chinese" })}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
                  ...(!isEnglish
                    ? { background: "rgba(220,38,38,0.10)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.22)", fontWeight: 600 }
                    : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 })
                }}
              >
                Tiếng Trung
              </button>
            </div>
          </div>

          {/* Type toggle */}
          <div>
            <label style={{ ...labelStyle, marginBottom: "8px" }}>Hình thức học</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["offline", "online"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
                    ...(form.type === t
                      ? { background: t === "online" ? "rgba(46,125,50,0.10)" : "rgba(230,81,0,0.10)", color: t === "online" ? "#2E7D32" : "#E65100", border: `1px solid ${t === "online" ? "rgba(46,125,50,0.25)" : "rgba(230,81,0,0.25)"}`, fontWeight: 600 }
                      : { background: "#FFF8FA", color: "#A87888", border: "1px solid #F4D8DE", fontWeight: 400 })
                  }}
                >
                  {t === "offline" ? "Offline" : "Online"}
                </button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Số điện thoại</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="0901 234 567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              onFocus={(e) => { e.target.style.borderColor = "#E8788A"; e.target.style.boxShadow = "0 0 0 3px rgba(232,120,138,0.20)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#F4D8DE"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>Địa chỉ</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="123 Đường ABC, Quận X..."
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              onFocus={(e) => { e.target.style.borderColor = "#E8788A"; e.target.style.boxShadow = "0 0 0 3px rgba(232,120,138,0.20)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#F4D8DE"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{ flex: 1, background: "#FFF8FA", color: "#6B4858", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "10px 0", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 2, background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", border: "none", borderRadius: "10px", padding: "10px 0", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Đang lưu..." : "Thêm học sinh"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
