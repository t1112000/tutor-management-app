"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Pencil, Check, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { generateSessions } from "@/lib/generateSessions";
import { todayVN } from "@/lib/time";
import useIsMobile from "@/hooks/use-is-mobile";

interface Schedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Student {
  id: number;
  name: string;
  subject: "english" | "chinese";
  schedules: Schedule[];
}

interface SessionRow {
  scheduledDate: string;
  startTime: string;
  endTime: string;
}

function formatDateVN(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatAmount(val: string) {
  const n = Number(val);
  if (!val || isNaN(n) || n <= 0) return null;
  return n.toLocaleString("vi-VN") + " đ";
}

// hdrStyle is now built dynamically inside the component (depends on isMobile)

export default function CreateBillClient({ studentId }: { studentId: number }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessionCount, setSessionCount] = useState("8");
  const [totalAmount, setTotalAmount] = useState("");
  const [startDate, setStartDate] = useState(todayVN());
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then(setStudent);
  }, [studentId]);

  useEffect(() => {
    if (!student) return;
    const count = parseInt(sessionCount) || 0;
    if (count > 0 && student.schedules.length > 0) {
      setSessions(generateSessions(startDate, count, student.schedules));
    } else {
      setSessions([]);
    }
  }, [student, sessionCount, startDate]);

  function updateSession(i: number, field: keyof SessionRow, value: string) {
    setSessions((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );
  }

  function removeSession(i: number) {
    setSessions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addSession() {
    const last = sessions[sessions.length - 1];
    setSessions((prev) => [
      ...prev,
      {
        scheduledDate: last?.scheduledDate ?? startDate,
        startTime: last?.startTime ?? "08:00",
        endTime: last?.endTime ?? "09:30",
      },
    ]);
  }

  async function submit() {
    if (!student) return;
    if (!totalAmount || Number(totalAmount) <= 0) {
      toast.error("Nhập số tiền hóa đơn");
      return;
    }
    if (sessions.length === 0) {
      toast.error("Cần ít nhất 1 buổi học");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          sessionCount: sessions.length,
          totalAmount: Number(totalAmount),
          startDate,
          notes: notes || undefined,
          sessions,
        }),
      });
      if (!res.ok) {
        toast.error("Tạo hóa đơn thất bại");
        return;
      }
      const { id } = await res.json();
      toast.success("Đã tạo hóa đơn");
      router.push(`/bills/${id}`);
    } finally {
      setSaving(false);
    }
  }

  const hdrStyle: React.CSSProperties = {
    height: 64,
    padding: isMobile ? "0 16px" : "0 32px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #F4D8DE",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    flexShrink: 0,
  };

  if (!student) {
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
        <div style={{ padding: isMobile ? 16 : 32, color: "#A87888" }}>Đang tải...</div>
      </div>
    );
  }

  const formattedAmount = formatAmount(totalAmount);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sticky header */}
      <div style={hdrStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href={`/students/${studentId}`}
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
            <ChevronLeft size={14} /> {student.name}
          </Link>
          <span style={{ color: "#E0C0C8", fontSize: 16 }}>/</span>
          <span style={{ fontWeight: 700, color: "#2C1820", fontSize: 15 }}>
            Tạo hóa đơn mới
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px" : "24px 32px" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 3fr", gap: 24 }}
        >
          {/* Left: bill settings */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "white",
                borderRadius: 20,
                border: "1px solid #F4D8DE",
                padding: 24,
              }}
            >
              <h2
                style={{
                  fontWeight: 700,
                  color: "#2C1820",
                  fontSize: 15,
                  marginBottom: 20,
                }}
              >
                Thông tin hóa đơn
              </h2>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "#2C1820",
                      marginBottom: 6,
                      fontWeight: 500,
                    }}
                  >
                    Số buổi học
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={sessionCount}
                    onChange={(e) => setSessionCount(e.target.value)}
                    style={{
                      background: "#FFF8FA",
                      borderColor: "#ECC8D0",
                      borderRadius: 10,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "#2C1820",
                      marginBottom: 6,
                      fontWeight: 500,
                    }}
                  >
                    Tổng học phí (đ)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="1500000"
                    style={{
                      background: "#FFF8FA",
                      borderColor: "#ECC8D0",
                      borderRadius: 10,
                    }}
                  />
                  {formattedAmount && (
                    <p style={{ fontSize: 12, color: "#E8788A", marginTop: 4 }}>
                      {formattedAmount}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "#2C1820",
                      marginBottom: 6,
                      fontWeight: 500,
                    }}
                  >
                    Ngày bắt đầu
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Chọn ngày bắt đầu"
                    style={{ width: isMobile ? "100%" : undefined }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "#2C1820",
                      marginBottom: 6,
                      fontWeight: 500,
                    }}
                  >
                    Ghi chú
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ghi chú..."
                    style={{
                      background: "#FFF8FA",
                      borderColor: "#ECC8D0",
                      borderRadius: 10,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={submit}
              disabled={saving}
              style={{
                width: "100%",
                height: 48,
                background: saving
                  ? "#F4D8DE"
                  : "linear-gradient(135deg,#E8788A,#F0A0B0)",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                cursor: saving ? "not-allowed" : "pointer",
                transition: "opacity 150ms",
              }}
            >
              {saving ? "Đang lưu..." : "Lưu hóa đơn"}
            </button>
          </div>

          {/* Right: sessions table */}
          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid #F4D8DE",
              overflow: "hidden",
            }}
          >

            {/* Title row — padded separately */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
              }}
            >
              <h2 style={{ fontWeight: 700, color: "#2C1820", fontSize: 15 }}>
                Các buổi học (tự động tạo)
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{ fontSize: 13, color: "#E8788A", fontWeight: 600 }}
                >
                  {sessions.length} buổi
                </span>
                {sessions.length > 0 && (
                  <button
                    onClick={() => setIsEditing((v) => !v)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: isEditing ? "#E8788A" : "#FFF0F3",
                      border: isEditing ? "none" : "1px solid #F4D8DE",
                      borderRadius: 8,
                      padding: "5px 12px",
                      color: isEditing ? "white" : "#A87888",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isEditing ? (
                      <>
                        <Check size={12} /> Xong
                      </>
                    ) : (
                      <>
                        <Pencil size={12} /> Chỉnh sửa
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {sessions.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: "#C4A0A8",
                  textAlign: "center",
                  padding: "32px 24px",
                }}
              >
                {student.schedules.length === 0
                  ? "Học sinh chưa có lịch học"
                  : "Nhập số buổi và ngày bắt đầu để tạo tự động"}
              </p>
            ) : (
              <>
                {/* Table full-width, padding on cells */}
                <div style={{ overflowX: isMobile ? "auto" : undefined }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#FFF0F3" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px 0 12px 24px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#E8788A",
                          letterSpacing: "0.06em",
                          width: 48,
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px 0",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#E8788A",
                          letterSpacing: "0.06em",
                        }}
                      >
                        NGÀY
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px 0",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#E8788A",
                          letterSpacing: "0.06em",
                        }}
                      >
                        BẮT ĐẦU
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px 24px 12px 0",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#E8788A",
                          letterSpacing: "0.06em",
                        }}
                      >
                        KẾT THÚC
                      </th>
                      {isEditing && (
                        <th
                          style={{ width: 48, padding: "12px 24px 12px 0" }}
                        />
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr
                        key={i}
                        style={{
                          background: "white",
                          borderBottom: "1px solid #FDE8EC",
                        }}
                      >
                        <td
                          style={{
                            padding: "16px 0 16px 24px",
                            color: "#E8788A",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {i + 1}
                        </td>
                        {isEditing ? (
                          <>
                            <td style={{ padding: "8px 16px 8px 0" }}>
                              <DatePicker
                                value={s.scheduledDate}
                                onChange={(v) =>
                                  updateSession(i, "scheduledDate", v)
                                }
                                placeholder="Chọn ngày"
                                style={{ height: 44, fontSize: 13, width: isMobile ? "100%" : undefined }}
                              />
                            </td>
                            <td style={{ padding: "8px 16px 8px 0" }}>
                              <TimePicker
                                label="Bắt đầu"
                                value={s.startTime}
                                onChange={(v) =>
                                  updateSession(i, "startTime", v)
                                }
                                onConfirm={() => setOpenPicker(null)}
                                open={openPicker === `${i}-start`}
                                onOpenChange={(o) =>
                                  setOpenPicker(o ? `${i}-start` : null)
                                }
                              >
                                <button
                                  type="button"
                                  style={{
                                    height: 44,
                                    padding: "0 12px",
                                    minWidth: 80,
                                    width: isMobile ? "100%" : undefined,
                                    background: "#FFF8FA",
                                    border: "1px solid #ECC8D0",
                                    borderRadius: 10,
                                    fontSize: 13,
                                    color: "#2C1820",
                                    cursor: "pointer",
                                    textAlign: "left",
                                  }}
                                >
                                  {s.startTime}
                                </button>
                              </TimePicker>
                            </td>
                            <td style={{ padding: "8px 24px 8px 0" }}>
                              <TimePicker
                                label="Kết thúc"
                                value={s.endTime}
                                onChange={(v) => updateSession(i, "endTime", v)}
                                onConfirm={() => setOpenPicker(null)}
                                open={openPicker === `${i}-end`}
                                onOpenChange={(o) =>
                                  setOpenPicker(o ? `${i}-end` : null)
                                }
                              >
                                <button
                                  type="button"
                                  style={{
                                    height: 44,
                                    padding: "0 12px",
                                    minWidth: 80,
                                    width: isMobile ? "100%" : undefined,
                                    background: "#FFF8FA",
                                    border: "1px solid #ECC8D0",
                                    borderRadius: 10,
                                    fontSize: 13,
                                    color: "#2C1820",
                                    cursor: "pointer",
                                    textAlign: "left",
                                  }}
                                >
                                  {s.endTime}
                                </button>
                              </TimePicker>
                            </td>
                            <td
                              style={{
                                padding: "8px 24px 8px 0",
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={() => removeSession(i)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#F4A0B0",
                                  padding: 4,
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td
                              style={{
                                padding: "16px 16px 16px 0",
                                color: "#2C1820",
                                fontSize: 14,
                              }}
                            >
                              {formatDateVN(s.scheduledDate)}
                            </td>
                            <td
                              style={{
                                padding: "16px 16px 16px 0",
                                color: "#2C1820",
                                fontSize: 14,
                              }}
                            >
                              {s.startTime}
                            </td>
                            <td
                              style={{
                                padding: "16px 24px 16px 0",
                                color: "#2C1820",
                                fontSize: 14,
                              }}
                            >
                              {s.endTime}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                {isEditing && (
                  <button
                    onClick={addSession}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      margin: "12px 24px",
                      padding: "8px 14px",
                      background: "#FFF0F3",
                      border: "1px dashed #F4D8DE",
                      borderRadius: 10,
                      color: "#E8788A",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      width: "calc(100% - 48px)",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={14} /> Thêm buổi
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
