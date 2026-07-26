"use client";

import { useEffect, useState } from "react";
import { useStudent, useAddSchedule, useRemoveSchedule, useEditSchedule } from "@/hooks/queries/use-student";
import type { StudentDetail, Schedule, BillSummary } from "@/hooks/queries/use-student";
import { useUpdateStudent, useDeleteStudent } from "@/hooks/queries/use-students";
import type { StudentForm } from "@/hooks/queries/use-students";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Pencil, Plus, X, Trash2 } from "lucide-react";
import { QueryErrorState } from "@/components/ui/query-error";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatMoneyVND, formatDateVN } from "@/lib/time";
import { useDeleteBill } from "@/hooks/queries/use-bill";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { STUDENT_COLORS } from "@/lib/student-colors";
import useIsMobile from "@/hooks/use-is-mobile";
import { ScheduleCard } from "./detail/ScheduleCard";
import { BillsTable } from "./detail/BillsTable";
import type { AddPicker, EditPicker } from "./detail/shared";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#C4A0A8",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  background: "#FFF8FA",
  borderColor: "#ECC8D0",
  borderRadius: 10,
};

const DEFAULT_COLOR = "#6BA8F0";

function studentToForm(s: StudentDetail): StudentForm {
  return {
    name: s.name,
    phone: s.phone ?? "",
    birthday: s.birthday ?? "",
    subject: s.subject,
    address: s.address ?? "",
    notes: s.notes ?? "",
    color: s.color ?? DEFAULT_COLOR,
    type: s.type ?? "offline",
  };
}

const hdrStyle: React.CSSProperties = {
  height: 64,
  padding: "0 32px",
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid #F4D8DE",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(12px)",
  position: "sticky",
  top: 0,
  zIndex: 10,
  flexShrink: 0,
  justifyContent: "space-between",
};

export default function StudentDetailClient({
  studentId,
}: {
  studentId: number;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const { data: student, isError: studentError, refetch: refetchStudent } = useStudent(studentId);
  const { mutate: updateStudentMutation, isPending: saving } = useUpdateStudent(studentId);
  const { mutate: deleteStudentMutation } = useDeleteStudent(studentId);
  const { mutate: addScheduleMutation } = useAddSchedule(studentId);
  const { mutate: removeScheduleMutation } = useRemoveSchedule(studentId);
  const { mutate: editScheduleMutation } = useEditSchedule(studentId);

  const [form, setForm] = useState<StudentForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [addPicker, setAddPicker] = useState<AddPicker | null>(null);
  const [editPicker, setEditPicker] = useState<EditPicker | null>(null);

  // Sync form when query data arrives or updates (but not while editing)
  useEffect(() => {
    if (student && !isEditing) {
      setForm(studentToForm(student));
    }
  }, [student, isEditing]);

  function updateForm(patch: Partial<StudentForm>) {
    setForm((f) => (f ? { ...f, ...patch } : f));
  }

  function startEdit() {
    if (student) setForm(studentToForm(student));
    setIsEditing(true);
  }

  function cancelEdit() {
    if (student) setForm(studentToForm(student));
    setIsEditing(false);
  }

  function saveStudent() {
    if (!form) return;
    updateStudentMutation(form, {
      onSuccess: () => {
        toast.success("Đã lưu thông tin");
        setIsEditing(false);
      },
      onError: () => toast.error("Lưu thất bại"),
    });
  }

  function pickColor(hex: string) {
    if (!form) return;
    const newForm = { ...form, color: hex };
    setForm(newForm);
    updateStudentMutation(newForm, {
      onError: () => toast.error("Không thể lưu màu"),
    });
  }

  function deleteStudent() {
    deleteStudentMutation(undefined, {
      onSuccess: () => {
        toast.success("Đã xóa học sinh");
        router.push("/students");
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Xóa học sinh thất bại"),
    });
  }

  function removeSchedule(scheduleId: number) {
    removeScheduleMutation(scheduleId);
  }

  function addSchedule(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ) {
    addScheduleMutation(
      { dayOfWeek, startTime, endTime },
      {
        onSuccess: () => {
          toast.success("Đã thêm lịch");
          setAddPicker(null);
        },
        onError: () => toast.error("Thêm lịch thất bại"),
      }
    );
  }

  function editSchedule(scheduleId: number, startTime: string, endTime: string) {
    editScheduleMutation(
      { scheduleId, startTime, endTime },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật lịch");
          setEditPicker(null);
        },
        onError: () => toast.error("Cập nhật lịch thất bại"),
      }
    );
  }

  if (!student || !form) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div style={hdrStyle} />
        {studentError ? (
          <QueryErrorState
            message="Không tải được thông tin học sinh"
            onRetry={() => refetchStudent()}
          />
        ) : (
          <div style={{ padding: 32, color: "#A87888" }}>Đang tải...</div>
        )}
      </div>
    );
  }

  const currentColor = form.color ?? DEFAULT_COLOR;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Sticky header ── */}
      {isMobile ? (
        // Mobile: two-row layout so long names don't fight with the button
        <div
          style={{
            ...hdrStyle,
            height: "auto",
            padding: "10px 16px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              href="/students"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#FFF0F3",
                border: "1px solid #F4D8DE",
                borderRadius: 8,
                padding: "5px 12px",
                color: "#A87888",
                fontSize: 13,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <ChevronLeft size={14} /> Học sinh
            </Link>
            <Link href={`/students/${studentId}/bills/new`}>
              <button
                style={{
                  background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "7px 14px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Plus size={14} /> Tạo hóa đơn mới
              </button>
            </Link>
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#2C1820",
              paddingLeft: 2,
              lineHeight: 1.3,
            }}
          >
            {student.name}
          </div>
        </div>
      ) : (
        <div style={{ ...hdrStyle, padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/students"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#FFF0F3",
                border: "1px solid #F4D8DE",
                borderRadius: 8,
                padding: "5px 12px",
                color: "#A87888",
                fontSize: 13,
                textDecoration: "none",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              <ChevronLeft size={14} /> Học sinh
            </Link>
            <span style={{ color: "#E0C0C8", fontSize: 16 }}>/</span>
            <span style={{ fontWeight: 700, color: "#2C1820", fontSize: 15 }}>
              {student.name}
            </span>
          </div>
          <Link href={`/students/${studentId}/bills/new`}>
            <button
              style={{
                background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "7px 16px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Plus size={14} /> Tạo hóa đơn mới
            </button>
          </Link>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: isMobile ? "16px" : "24px 32px",
        }}
      >
        {/* ── Info card ── */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #F4D8DE",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              gap: 8,
            }}
          >
            <h2
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#2C1820",
                margin: 0,
                flexShrink: 0,
              }}
            >
              Thông tin học sinh
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              {!isEditing && (
                <button
                  onClick={startEdit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#A87888",
                    background: "#FFF0F3",
                    border: "1px solid #F4D8DE",
                    borderRadius: 8,
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Pencil size={13} /> Chỉnh sửa
                </button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    style={{
                      fontSize: 12,
                      color: "#F07888",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Xóa học sinh
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xoá học sinh {student.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {student.bills.length > 0
                        ? `${student.bills.length} hóa đơn và toàn bộ lịch dạy của học sinh này sẽ được ẩn khỏi lịch, danh sách và báo cáo.`
                        : "Học sinh này sẽ được ẩn khỏi lịch, danh sách và báo cáo."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Huỷ</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteStudent}
                      style={{ background: "#E11D48", color: "white" }}
                    >
                      Xoá
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {isEditing ? (
            /* ── Edit mode ── */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "16px 24px",
              }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={labelStyle}>Họ và tên</span>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="Nhập họ và tên"
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>Môn học</span>
                <Select
                  value={form.subject}
                  onValueChange={(v: "english" | "chinese") =>
                    updateForm({ subject: v })
                  }
                >
                  <SelectTrigger style={inputStyle}>
                    <SelectValue placeholder="Chọn môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">Tiếng Anh</SelectItem>
                    <SelectItem value="chinese">Tiếng Trung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span style={labelStyle}>Số điện thoại</span>
                <Input
                  value={form.phone}
                  onChange={(e) => updateForm({ phone: e.target.value })}
                  placeholder="0901 234 567"
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>Địa chỉ</span>
                <Input
                  value={form.address}
                  onChange={(e) => updateForm({ address: e.target.value })}
                  placeholder="Nhập địa chỉ"
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>Ngày sinh</span>
                <DatePicker
                  value={form.birthday}
                  onChange={(v) => updateForm({ birthday: v })}
                  placeholder="Chọn ngày sinh"
                />
              </div>
              <div>
                <span style={labelStyle}>Hình thức học</span>
                <div
                  style={{
                    display: "flex",
                    background: "#F8F0F4",
                    borderRadius: 10,
                    padding: 3,
                    gap: 2,
                    width: "fit-content",
                    marginTop: 2,
                  }}
                >
                  {(["offline", "online"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateForm({ type: t })}
                      style={{
                        padding: "6px 20px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 120ms ease",
                        background: form.type === t ? "white" : "transparent",
                        color: form.type === t ? "#2C1820" : "#A87888",
                        boxShadow:
                          form.type === t
                            ? "0 1px 4px rgba(0,0,0,0.08)"
                            : "none",
                      }}
                    >
                      {t === "offline" ? "Offline" : "Online"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={labelStyle}>Ghi chú</span>
                <Textarea
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  rows={2}
                  placeholder="Ghi chú thêm..."
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <button
                  onClick={saveStudent}
                  disabled={saving}
                  style={{
                    background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 18px",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Đang lưu..." : "Lưu thông tin"}
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    background: "white",
                    color: "#A87888",
                    border: "1px solid #F4D8DE",
                    borderRadius: 8,
                    padding: "7px 16px",
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? "16px" : "20px 40px",
              }}
            >
              <div>
                <span style={labelStyle}>Họ và tên</span>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: "#2C1820" }}
                >
                  {student.name || "—"}
                </div>
              </div>
              <div>
                <span style={labelStyle}>Môn học</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 13,
                      fontWeight: 500,
                      background: "#EBF5FF",
                      color: "#3B82F6",
                      padding: "3px 12px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {student.subject === "english"
                      ? "Tiếng Anh"
                      : "Tiếng Trung"}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 13,
                      fontWeight: 500,
                      background:
                        student.type === "online" ? "#E8F5E9" : "#FFF3E0",
                      color: student.type === "online" ? "#2E7D32" : "#E65100",
                      padding: "3px 12px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {student.type === "online" ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              <div>
                <span style={labelStyle}>Số điện thoại</span>
                <div style={{ fontSize: 15, color: "#2C1820" }}>
                  {student.phone || "—"}
                </div>
              </div>
              <div>
                <span style={labelStyle}>Địa chỉ</span>
                <div style={{ fontSize: 15, color: "#2C1820" }}>
                  {student.address || "—"}
                </div>
              </div>
              {student.birthday && (
                <div>
                  <span style={labelStyle}>Ngày sinh</span>
                  <div style={{ fontSize: 15, color: "#2C1820" }}>
                    {formatDateVN(student.birthday)}
                  </div>
                </div>
              )}
              {student.notes && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={labelStyle}>Ghi chú</span>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {student.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Color picker — always visible */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #F9F0F2",
            }}
          >
            <span style={labelStyle}>Màu trên lịch</span>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {STUDENT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => pickColor(c.hex)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: c.hex,
                    border:
                      currentColor === c.hex
                        ? "3px solid white"
                        : "3px solid transparent",
                    boxShadow:
                      currentColor === c.hex ? `0 0 0 2.5px ${c.hex}` : "none",
                    cursor: "pointer",
                    transition: "box-shadow 120ms ease",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Schedule card ── */}
        <ScheduleCard
          student={student}
          addPicker={addPicker}
          setAddPicker={setAddPicker}
          editPicker={editPicker}
          setEditPicker={setEditPicker}
          removeSchedule={removeSchedule}
          addSchedule={addSchedule}
          editSchedule={editSchedule}
          isMobile={isMobile}
        />

        {/* ── Bills table ── */}
        <BillsTable
          bills={student.bills}
          studentId={studentId}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

