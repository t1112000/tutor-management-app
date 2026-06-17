"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubjectBadge } from "@/components/ui/subject-badge";
import AddStudentDialog from "./AddStudentDialog";

interface Student {
  id: number;
  name: string;
  subject: "english" | "chinese";
  phone: string | null;
  bills?: Array<{ id: number }>;
}

const AVATAR_COLORS = [
  "#6BA8F0", "#F07888", "#7ECBA0", "#B088F0",
  "#F0A860", "#60C8D8", "#E8C860", "#F09090",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initial(name: string): string {
  return name.trim().split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "?";
}

const hdrStyle: React.CSSProperties = {
  height: "64px", padding: "0 32px", display: "flex", alignItems: "center",
  borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0,
};

export default function StudentsClient() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function load(q = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/students${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function onSearch(q: string) {
    setSearch(q);
    const timer = setTimeout(() => load(q), 300);
    return () => clearTimeout(timer);
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Sticky header */}
      <div style={hdrStyle}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#2C1820", letterSpacing: "-0.4px", margin: 0 }}>Học sinh</h1>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white",
              border: "none", borderRadius: "10px", padding: "9px 16px",
              fontSize: "14px", fontWeight: 500, cursor: "pointer",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Thêm học sinh
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 32px" }}>
        {/* Search */}
        <div style={{ marginBottom: "18px", display: "flex", gap: "12px" }}>
          <div style={{ position: "relative", maxWidth: "340px", flex: 1 }}>
            <svg style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9098a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, số điện thoại..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              style={{ width: "100%", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "9px 12px 9px 34px", fontSize: "14px", color: "#2C1820", outline: "none", fontFamily: "inherit" }}
              onFocus={(e) => { e.target.style.borderColor = "#E8788A"; e.target.style.boxShadow = "0 0 0 3px rgba(232,120,138,0.20)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#F4D8DE"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FFF8FA" }}>
                {["Tên học sinh", "Môn học", "SĐT", "Số hóa đơn", "Thao tác"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Đang tải...</td></tr>
              ) : !students.length ? (
                <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Chưa có học sinh nào</td></tr>
              ) : students.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => router.push(`/students/${s.id}`)}
                  style={{ borderTop: "1px solid #F4D8DE", cursor: "pointer", transition: "background 120ms ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF8FA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "9999px", background: getAvatarColor(s.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                        {initial(s.name)}
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#2C1820" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}><SubjectBadge subject={s.subject} /></td>
                  <td style={{ padding: "13px 16px", fontSize: "13px", color: "#6B4858", fontFamily: "monospace" }}>{s.phone ?? "—"}</td>
                  <td style={{ padding: "13px 16px", fontSize: "14px", color: "#6B4858" }}>{s.bills?.length ?? 0} hóa đơn</td>
                  <td style={{ padding: "13px 16px" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/students/${s.id}`); }}
                      style={{ fontSize: "13px", color: "#E8788A", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}
                    >
                      Xem chi tiết →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddStudentDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreated={() => { setShowAdd(false); load(search); }}
      />
    </div>
  );
}
