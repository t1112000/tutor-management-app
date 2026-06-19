"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useIsMobile from "@/hooks/use-is-mobile";
import { toast } from "sonner";
import { Calendar, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatMoneyVND } from "@/lib/time";
import { useBill, useUpdateSession, usePayBill, Bill, BillSession } from "@/hooks/queries/use-bill";

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function parseTime(t: string): [number, number] {
  const [h, m] = t.split(":").map(Number);
  return [h ?? 0, m ?? 0];
}

const hdrStyle: React.CSSProperties = {
  height: 64, padding: "0 32px", display: "flex", alignItems: "center",
  borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0,
};

const cardStyle: React.CSSProperties = {
  background: "white", border: "1px solid #F4D8DE", borderRadius: 16,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#A87888", letterSpacing: "0.5px",
  textTransform: "uppercase", marginBottom: 4,
};

const colHdr: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#A87888", letterSpacing: "0.5px", textTransform: "uppercase",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "4px 10px", background: "#FFF8FA", border: "1px solid #F4D8DE",
  borderRadius: 8, fontSize: 13, color: "#2C1820", cursor: "pointer",
  transition: "border-color 120ms ease", width: "fit-content",
};

function TimeSpinner({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [h, m] = parseTime(value);
  const MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const mIdx = Math.max(0, MINS.indexOf(MINS.find((x) => x === m) ?? 0));

  const btn: React.CSSProperties = {
    width: 36, height: 28, background: "#F8F0F4", border: "1px solid #F4D8DE",
    borderRadius: 8, cursor: "pointer", fontSize: 11, color: "#A87888",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const box: React.CSSProperties = {
    width: 52, height: 48, background: "#F8F0F4", border: "1px solid #F4D8DE",
    borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, fontWeight: 700, color: "#2C1820",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 11, color: "#A87888", fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button style={btn} onClick={() => onChange(`${pad((h + 1) % 24)}:${pad(MINS[mIdx])}`)}>▲</button>
          <div style={box}>{pad(h)}</div>
          <button style={btn} onClick={() => onChange(`${pad((h - 1 + 24) % 24)}:${pad(MINS[mIdx])}`)}>▼</button>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#2C1820", paddingTop: 28 }}>:</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button style={btn} onClick={() => onChange(`${pad(h)}:${pad(MINS[(mIdx + 1) % MINS.length])}`)}>▲</button>
          <div style={box}>{pad(MINS[mIdx])}</div>
          <button style={btn} onClick={() => onChange(`${pad(h)}:${pad(MINS[(mIdx - 1 + MINS.length) % MINS.length])}`)}>▼</button>
        </div>
      </div>
    </div>
  );
}

export default function BillDetailClient({ billId }: { billId: number }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: bill } = useBill(billId);
  const { mutate: updateSessionMutation } = useUpdateSession(billId);
  const { mutate: markPaidMutation, isPending: payLoading } = usePayBill(billId);
  const [timeEdit, setTimeEdit] = useState<{ id: number; start: string; end: string; open: boolean } | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ id: number; value: string } | null>(null);
  const notesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingNotes) notesRef.current?.focus();
  }, [editingNotes?.id]);

  function saveSession(sessionId: number, updates: Record<string, unknown>) {
    updateSessionMutation({ sessionId, updates });
  }

  function toggleAttended(sessionId: number, current: boolean) {
    saveSession(sessionId, { isAttended: !current });
  }

  function markPaid() {
    markPaidMutation(undefined, {
      onSuccess: () => toast.success("Đã đánh dấu thanh toán"),
      onError: () => toast.error("Thao tác thất bại"),
    });
  }

  if (!bill) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#A87888" }}>
      Đang tải...
    </div>
  );

  const attended = bill.sessions.filter((s) => s.isAttended).length;
  const pct = bill.sessionCount > 0 ? Math.round((attended / bill.sessionCount) * 100) : 0;
  const sorted = [...bill.sessions].sort((a, b) =>
    a.scheduledDate.localeCompare(b.scheduledDate) || a.startTime.localeCompare(b.startTime)
  );
  const isPaid = bill.status === "paid";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Sticky header */}
      <div style={{ ...hdrStyle, padding: isMobile ? "0 16px" : "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => router.push(`/students/${bill.student.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
              background: "#FFF0F5", border: "1px solid #F4D8DE", borderRadius: 8,
              cursor: "pointer", fontSize: 13, color: "#C06070", fontWeight: 500,
            }}
          >
            ← {bill.student.name}
          </button>
          <span style={{ color: "#D4A0B0", fontSize: 14 }}>/</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#2C1820" }}>Chi tiết hóa đơn</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto", minHeight: 0, padding: isMobile ? "16px" : "24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>

        {isMobile ? (
          /* ── Mobile layout ── */
          <>
            {/* Compact summary card: name + status + amount + progress + pay button */}
            <div style={{ ...cardStyle, padding: "18px 20px" }}>
              {/* Name + status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#2C1820", lineHeight: 1.2 }}>{bill.student.name}</div>
                  <div style={{ fontSize: 12, color: "#A87888", marginTop: 3 }}>
                    {bill.student.subject === "english" ? "Tiếng Anh" : "Tiếng Trung"}
                  </div>
                </div>
                <span style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, flexShrink: 0,
                  background: isPaid ? "#D1FAE5" : "#FEF3C7",
                  color: isPaid ? "#065F46" : "#92400E",
                }}>
                  {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
              </div>

              {/* Amount + sessions count */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#A87888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Học phí</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#E8788A" }}>{formatMoneyVND(bill.totalAmount)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#2C1820" }}>{attended}/{bill.sessionCount} buổi</div>
                  <div style={{ fontSize: 12, color: "#E8788A", fontWeight: 700 }}>{pct}%</div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 7, background: "#F4D8DE", borderRadius: 99, overflow: "hidden", marginBottom: isPaid ? 0 : 14 }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: "linear-gradient(90deg,#E8788A,#F0A0B0)",
                  borderRadius: 99, transition: "width 600ms ease",
                }} />
              </div>

              {/* Pay button */}
              {!isPaid && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button style={{
                      width: "100%", height: 44, border: "none", borderRadius: 12, cursor: "pointer",
                      background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
                      color: "white", fontWeight: 700, fontSize: 14,
                    }}>
                      Đánh dấu đã thanh toán
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận thanh toán</AlertDialogTitle>
                      <AlertDialogDescription>
                        Đánh dấu hóa đơn {formatMoneyVND(bill.totalAmount)} là đã thanh toán?
                        {attended < bill.sessionCount && (
                          <span style={{ display: "block", marginTop: 8, color: "#E8780A" }}>
                            Lưu ý: còn {bill.sessionCount - attended} buổi chưa điểm danh.
                          </span>
                        )}
                        <span style={{ display: "block", marginTop: 4, color: "#E8788A", fontSize: 12 }}>
                          Hành động này không thể hoàn tác.
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={markPaid} disabled={payLoading}>
                        {payLoading ? "Đang xử lý..." : "Xác nhận"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Sessions list card */}
            <div style={{ ...cardStyle, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #FDE8EC" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#2C1820", margin: 0 }}>
                  Danh sách buổi học
                </h2>
              </div>
              {sorted.map((s, i) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 20px",
                  borderBottom: i < sorted.length - 1 ? "1px solid #FDE8EC" : "none",
                  background: s.isAttended ? "rgba(232,120,138,0.04)" : "transparent",
                }}>
                  <span style={{ fontSize: 12, color: "#C4A0A8", fontWeight: 700, width: 18, flexShrink: 0, textAlign: "right" }}>{i + 1}</span>

                  {/* Date */}
                  <div style={{ flex: 1 }}>
                    {isPaid ? (
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#2C1820" }}>{fmtDate(s.scheduledDate)}</div>
                    ) : (
                      <DatePicker
                        value={s.scheduledDate}
                        onChange={(d) => saveSession(s.id, { scheduledDate: d })}
                        trigger={
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#2C1820", cursor: "pointer", display: "block" }}>
                            {fmtDate(s.scheduledDate)}
                          </div>
                        }
                      />
                    )}
                    {/* Time */}
                    {isPaid ? (
                      <div style={{ fontSize: 12, color: "#A87888", marginTop: 2 }}>{s.startTime} – {s.endTime}</div>
                    ) : (
                      <Popover
                        open={timeEdit?.id === s.id && timeEdit.open}
                        onOpenChange={(o) => { if (!o && timeEdit?.id === s.id) setTimeEdit(null); }}
                      >
                        <PopoverTrigger asChild>
                          <div
                            style={{ fontSize: 12, color: "#A87888", marginTop: 2, cursor: "pointer", display: "inline-block" }}
                            onClick={() => setTimeEdit({ id: s.id, start: s.startTime, end: s.endTime, open: true })}
                          >
                            {s.startTime} – {s.endTime}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent style={{
                          width: 280, padding: 20, borderRadius: 18,
                          border: "1px solid #F4D8DE",
                          boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                          background: "white",
                        }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: "#2C1820", margin: "0 0 16px" }}>Chỉnh giờ học</p>
                          {timeEdit?.id === s.id && (
                            <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 16 }}>
                              <TimeSpinner label="Bắt đầu" value={timeEdit.start} onChange={(v) => setTimeEdit({ ...timeEdit, start: v })} />
                              <TimeSpinner label="Kết thúc" value={timeEdit.end} onChange={(v) => setTimeEdit({ ...timeEdit, end: v })} />
                            </div>
                          )}
                          <button onClick={async () => { if (!timeEdit) return; await saveSession(s.id, { startTime: timeEdit.start, endTime: timeEdit.end }); setTimeEdit(null); }}
                            style={{ width: "100%", height: 36, border: "none", borderRadius: 10, cursor: "pointer", background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white", fontWeight: 600, fontSize: 13 }}>
                            Lưu
                          </button>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Attendance toggle */}
                  <Checkbox
                    checked={s.isAttended}
                    onCheckedChange={() => toggleAttended(s.id, s.isAttended)}
                    disabled={isPaid}
                  />
                </div>
              ))}
            </div>

            {/* spacer to cover body background */}
            <div style={{ height: 8 }} />
          </>
        ) : (
          /* ── Desktop layout ── */
          <>
            {/* Info card */}
            <div style={{ ...cardStyle, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "48px" }}>
                <div>
                  <div style={labelStyle}>Học sinh</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#2C1820" }}>{bill.student.name}</div>
                </div>
                <div>
                  <div style={labelStyle}>Học phí</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#2C1820" }}>{formatMoneyVND(bill.totalAmount)}</div>
                </div>
                <div>
                  <div style={labelStyle}>Tiến độ</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#2C1820" }}>{attended}/{bill.sessionCount} buổi đã học</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  background: isPaid ? "#D1FAE5" : "#FEF3C7",
                  color: isPaid ? "#065F46" : "#92400E",
                }}>
                  {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
                {!isPaid && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button style={{
                        padding: "7px 18px", borderRadius: 10, border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
                        color: "white", fontWeight: 600, fontSize: 13,
                      }}>
                        Đánh dấu đã thanh toán
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận thanh toán</AlertDialogTitle>
                        <AlertDialogDescription>
                          Đánh dấu hóa đơn {formatMoneyVND(bill.totalAmount)} là đã thanh toán?
                          {attended < bill.sessionCount && (
                            <span style={{ display: "block", marginTop: 8, color: "#E8780A" }}>
                              Lưu ý: còn {bill.sessionCount - attended} buổi chưa điểm danh.
                            </span>
                          )}
                          <span style={{ display: "block", marginTop: 4, color: "#E8788A", fontSize: 12 }}>
                            Hành động này không thể hoàn tác.
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={markPaid} disabled={payLoading}>
                          {payLoading ? "Đang xử lý..." : "Xác nhận"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Progress card */}
            <div style={{ ...cardStyle, padding: "20px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#2C1820" }}>
                  {attended}/{bill.sessionCount} buổi đã học
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#E8788A" }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: "#F4D8DE", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: "linear-gradient(90deg,#E8788A,#F0A0B0)",
                  borderRadius: 99, transition: "width 600ms ease",
                }} />
              </div>
            </div>

            {/* Sessions table */}
            <div style={{ ...cardStyle, padding: "20px 28px" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#2C1820", margin: "0 0 16px" }}>
                Danh sách buổi học
              </h2>
              {(
            <>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "48px 1fr 1fr 88px 1fr",
                padding: "6px 12px", marginBottom: 2,
              }}>
                <span style={colHdr}>#</span>
                <span style={colHdr}>Ngày</span>
                <span style={colHdr}>Giờ</span>
                <span style={{ ...colHdr, textAlign: "center" }}>Đã học</span>
                <span style={colHdr}>Ghi chú</span>
              </div>

              {/* Rows */}
              {sorted.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "grid", gridTemplateColumns: "48px 1fr 1fr 88px 1fr",
                    alignItems: "center", padding: "10px 12px", borderRadius: 10,
                    background: s.isAttended ? "#FFF5F8" : "transparent",
                    borderBottom: i < sorted.length - 1 ? "1px solid #F8ECF0" : "none",
                  }}
                >
                  {/* # */}
                  <span style={{ fontSize: 13, color: "#A87888", fontWeight: 500 }}>{i + 1}</span>

                  {/* Date — DatePicker */}
                  {isPaid ? (
                    <span style={{ ...badgeStyle, cursor: "default" }}>
                      <Calendar size={12} color="#C4909A" />
                      {fmtDate(s.scheduledDate)}
                    </span>
                  ) : (
                    <DatePicker
                      value={s.scheduledDate}
                      onChange={(d) => saveSession(s.id, { scheduledDate: d })}
                      trigger={
                        <span style={badgeStyle}>
                          <Calendar size={12} color="#C4909A" />
                          {fmtDate(s.scheduledDate)}
                        </span>
                      }
                    />
                  )}

                  {/* Time — custom popover */}
                  {isPaid ? (
                    <span style={{ ...badgeStyle, cursor: "default" }}>
                      <Clock size={12} color="#C4909A" />
                      {s.startTime} – {s.endTime}
                    </span>
                  ) : (
                    <Popover
                      open={timeEdit?.id === s.id && timeEdit.open}
                      onOpenChange={(o) => {
                        if (!o && timeEdit?.id === s.id) setTimeEdit(null);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <span
                          style={badgeStyle}
                          onClick={() => setTimeEdit({ id: s.id, start: s.startTime, end: s.endTime, open: true })}
                        >
                          <Clock size={12} color="#C4909A" />
                          {s.startTime} – {s.endTime}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent style={{
                        width: 280, padding: 20, borderRadius: 18,
                        border: "1px solid #F4D8DE",
                        boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                        background: "white",
                      }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "#2C1820", margin: "0 0 16px" }}>Chỉnh giờ học</p>
                        {timeEdit?.id === s.id && (
                          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 16 }}>
                            <TimeSpinner
                              label="Bắt đầu"
                              value={timeEdit.start}
                              onChange={(v) => setTimeEdit({ ...timeEdit, start: v })}
                            />
                            <TimeSpinner
                              label="Kết thúc"
                              value={timeEdit.end}
                              onChange={(v) => setTimeEdit({ ...timeEdit, end: v })}
                            />
                          </div>
                        )}
                        <button
                          onClick={async () => {
                            if (!timeEdit) return;
                            await saveSession(s.id, { startTime: timeEdit.start, endTime: timeEdit.end });
                            setTimeEdit(null);
                          }}
                          style={{
                            width: "100%", height: 36, border: "none", borderRadius: 10, cursor: "pointer",
                            background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
                            color: "white", fontWeight: 600, fontSize: 13,
                          }}
                        >
                          Lưu
                        </button>
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* Attended checkbox */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Checkbox
                      checked={s.isAttended}
                      onCheckedChange={() => toggleAttended(s.id, s.isAttended)}
                      disabled={isPaid}
                    />
                  </div>

                  {/* Notes — inline edit */}
                  {editingNotes?.id === s.id ? (
                    <input
                      ref={notesRef}
                      value={editingNotes.value}
                      onChange={(e) => setEditingNotes({ id: s.id, value: e.target.value })}
                      onBlur={async () => {
                        await saveSession(s.id, { notes: editingNotes.value });
                        setEditingNotes(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditingNotes(null);
                      }}
                      style={{
                        width: "100%", height: 32, padding: "0 8px",
                        background: "#FFF8FA", border: "1px solid #ECC8D0",
                        borderRadius: 8, fontSize: 13, color: "#2C1820", outline: "none",
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => !isPaid && setEditingNotes({ id: s.id, value: s.notes ?? "" })}
                      style={{
                        fontSize: 13, color: s.notes ? "#2C1820" : "#D4B0B8",
                        cursor: isPaid ? "default" : "text",
                        minHeight: 24, display: "block",
                        padding: "4px 6px", borderRadius: 6,
                        transition: "background 120ms ease",
                      }}
                      title={isPaid ? "" : "Click để chỉnh sửa"}
                    >
                      {s.notes || (isPaid ? "" : "Thêm ghi chú...")}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
