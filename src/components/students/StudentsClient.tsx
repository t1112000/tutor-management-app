"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { QueryErrorState } from "@/components/ui/query-error";
import AddStudentDialog from "./AddStudentDialog";
import useIsMobile from "@/hooks/use-is-mobile";
import { toast } from "sonner";
import { Trash2, RotateCcw } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useStudents, useDeleteStudentById, useRestoreStudent, type Student,
} from "@/hooks/queries/use-students";

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

function getHdrStyle(isMobile: boolean): React.CSSProperties {
  return {
    height: "64px", padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center",
    borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0,
  };
}

export default function StudentsClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState("");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [toDelete, setToDelete] = useState<Student | null>(null);

  // Debounce the search query 300ms
  useEffect(() => {
    const t = setTimeout(() => setQ(inputValue), 300);
    return () => clearTimeout(t);
  }, [inputValue]);

  const { data: students = [], isLoading: loading, isError, refetch } = useStudents(q, showDeleted);
  const { mutate: deleteStudent, isPending: deleting } = useDeleteStudentById();
  const { mutate: restoreStudent, isPending: restoring } = useRestoreStudent();

  function confirmDelete() {
    if (!toDelete) return;
    deleteStudent(toDelete.id, {
      onSuccess: () => toast.success("Đã xoá học sinh"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Xoá học sinh thất bại"),
      onSettled: () => setToDelete(null),
    });
  }

  function restore(id: number) {
    restoreStudent(id, {
      onSuccess: () => toast.success("Đã khôi phục học sinh"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Khôi phục thất bại"),
    });
  }

  const emptyText = showDeleted ? "Không có học sinh nào đã xoá" : "Chưa có học sinh nào";
  const iconBtn = (color: string, bg: string, border: string): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: "50%", background: bg, border: `1px solid ${border}`,
    cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color,
  });

  function onSearch(value: string) {
    setInputValue(value);
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Sticky header */}
      <div style={getHdrStyle(isMobile)}>
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
      <div style={{ padding: isMobile ? "16px 16px" : "24px 32px" }}>
        {/* Active / deleted toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          {([[false, "Đang học"], [true, "Đã xoá"]] as const).map(([val, label]) => (
            <button
              key={label}
              onClick={() => setShowDeleted(val)}
              style={{
                padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                border: "1px solid #F4D8DE",
                background: showDeleted === val ? "#E8788A" : "white",
                color: showDeleted === val ? "white" : "#6B4858",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: "18px", display: "flex", gap: "12px" }}>
          <div style={{ position: "relative", maxWidth: isMobile ? "none" : "340px", flex: 1 }}>
            <svg style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9098a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, số điện thoại..."
              value={inputValue}
              onChange={(e) => onSearch(e.target.value)}
              style={{ width: "100%", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "9px 12px 9px 34px", fontSize: "14px", color: "#2C1820", outline: "none", fontFamily: "inherit" }}
              onFocus={(e) => { e.target.style.borderColor = "#E8788A"; e.target.style.boxShadow = "0 0 0 3px rgba(232,120,138,0.20)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#F4D8DE"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Table (desktop) / Card list (mobile) */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {loading ? (
              <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Đang tải...</div>
            ) : isError ? (
              <QueryErrorState message="Không tải được danh sách học sinh" onRetry={() => refetch()} compact />
            ) : !students.length ? (
              <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>{emptyText}</div>
            ) : students.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/students/${s.id}`)}
                style={{
                  background: "white", border: "1px solid #F4D8DE", borderRadius: "12px",
                  padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px",
                  cursor: "pointer",
                }}
              >
                {/* Avatar circle */}
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: getAvatarColor(s.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: 600, flexShrink: 0 }}>
                  {initial(s.name)}
                </div>
                {/* Name + subject badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                    <SubjectBadge subject={s.subject} />
                    {s.phone && <span style={{ fontSize: "12px", color: "#A87888", fontFamily: "monospace" }}>{s.phone}</span>}
                  </div>
                </div>
                {/* Bill count + chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {(s.bills?.length ?? 0) > 0 && (
                    <span style={{ fontSize: "12px", color: "#A87888" }}>{s.bills?.length} hóa đơn</span>
                  )}
                  {showDeleted ? (
                    <button aria-label="Khôi phục" title="Khôi phục" disabled={restoring}
                      onClick={(e) => { e.stopPropagation(); restore(s.id); }}
                      style={iconBtn("#1a8a3c", "#F0FDF4", "#BBF7D0")}><RotateCcw size={14} /></button>
                  ) : (
                    <button aria-label="Xoá học sinh" title="Xoá học sinh"
                      onClick={(e) => { e.stopPropagation(); setToDelete(s); }}
                      style={iconBtn("#E11D48", "#FFF1F2", "#FECDD3")}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                ) : isError ? (
                  <tr><td colSpan={5}><QueryErrorState message="Không tải được danh sách học sinh" onRetry={() => refetch()} compact /></td></tr>
                ) : !students.length ? (
                  <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>{emptyText}</td></tr>
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
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/students/${s.id}`); }}
                          style={{ fontSize: "13px", color: "#E8788A", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}
                        >
                          Xem chi tiết →
                        </button>
                        {showDeleted ? (
                          <button aria-label="Khôi phục" title="Khôi phục" disabled={restoring}
                            onClick={(e) => { e.stopPropagation(); restore(s.id); }}
                            style={{ ...iconBtn("#1a8a3c", "#F0FDF4", "#BBF7D0"), width: "auto", borderRadius: 9999, padding: "0 10px", gap: 4, fontSize: 12 }}>
                            <RotateCcw size={13} /> Khôi phục
                          </button>
                        ) : (
                          <button aria-label="Xoá học sinh" title="Xoá học sinh"
                            onClick={(e) => { e.stopPropagation(); setToDelete(s); }}
                            style={iconBtn("#E11D48", "#FFF1F2", "#FECDD3")}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá học sinh {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Học sinh sẽ được ẩn khỏi danh sách, lịch dạy và nhắc lịch. Các hóa đơn đã có vẫn được giữ lại
              trong báo cáo và lịch sử. Bạn có thể khôi phục lại ở tab &quot;Đã xoá&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              style={{ background: "#E11D48", color: "white" }}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddStudentDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreated={() => setShowAdd(false)}
      />
    </div>
  );
}
