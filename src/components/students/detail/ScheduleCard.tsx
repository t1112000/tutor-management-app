"use client";

import { Pencil, X } from "lucide-react";
import type { StudentDetail } from "@/hooks/queries/use-student";
import { TimeSpinnerCol } from "./TimeSpinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addOneHour, DAY_NAMES, DAY_VALUES, type AddPicker, type EditPicker } from "./shared";

// ── ScheduleCard ─────────────────────────────────────────────────────────────
interface ScheduleCardProps {
  student: StudentDetail;
  addPicker: AddPicker | null;
  setAddPicker: React.Dispatch<React.SetStateAction<AddPicker | null>>;
  editPicker: EditPicker | null;
  setEditPicker: React.Dispatch<React.SetStateAction<EditPicker | null>>;
  removeSchedule: (id: number) => void;
  addSchedule: (dow: number, start: string, end: string) => void;
  editSchedule: (id: number, start: string, end: string) => void;
  isMobile: boolean;
}

export function ScheduleCard({
  student,
  addPicker,
  setAddPicker,
  editPicker,
  setEditPicker,
  removeSchedule,
  addSchedule,
  editSchedule,
  isMobile,
}: ScheduleCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        border: "1px solid #F4D8DE",
        padding: 24,
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "#2C1820",
          margin: "0 0 20px",
        }}
      >
        Lịch dạy cố định hàng tuần
      </h2>

      {isMobile ? (
        /* ── Mobile: vertical list of days with schedules ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DAY_NAMES.map((dayName, idx) => {
            const dow = DAY_VALUES[idx];
            const daySchedules = student.schedules.filter(
              (s) => s.dayOfWeek === dow,
            );
            const isOpen = addPicker?.dayOfWeek === dow;

            return (
              <div
                key={dow}
                style={{
                  background: "#FFF8FA",
                  borderRadius: 10,
                  padding: "10px 14px",
                  border: "1px solid #F4D8DE",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: daySchedules.length > 0 ? 8 : 0,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, fontSize: 13, color: "#2C1820" }}
                  >
                    {dayName}
                  </div>
                  <Popover
                    open={isOpen}
                    onOpenChange={(o) => {
                      if (!o) setAddPicker(null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        onClick={() =>
                          setAddPicker({
                            dayOfWeek: dow,
                            startTime: "07:00",
                            endTime: "08:00",
                          })
                        }
                        style={{
                          background: "none",
                          border: "1px dashed #F4D8DE",
                          borderRadius: 6,
                          width: 26,
                          height: 26,
                          cursor: "pointer",
                          color: "#C4A0A8",
                          fontSize: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        +
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      style={{
                        width: 320,
                        padding: 20,
                        borderRadius: 20,
                        border: "1px solid #F4D8DE",
                        boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                        background: "white",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#2C1820",
                          margin: "0 0 16px",
                        }}
                      >
                        Thêm lịch — {dayName}
                      </p>
                      {isOpen && addPicker && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              justifyContent: "center",
                              alignItems: "center",
                              marginBottom: 16,
                            }}
                          >
                            <TimeSpinnerCol
                              label="Bắt đầu"
                              time={addPicker.startTime}
                              onChange={(v) =>
                                setAddPicker((p) =>
                                  p
                                    ? {
                                        ...p,
                                        startTime: v,
                                        endTime: addOneHour(v),
                                      }
                                    : p,
                                )
                              }
                            />
                            <span
                              style={{
                                fontSize: 20,
                                color: "#D4A0B0",
                                marginTop: 16,
                              }}
                            >
                              →
                            </span>
                            <TimeSpinnerCol
                              label="Kết thúc"
                              time={addPicker.endTime}
                              onChange={(v) =>
                                setAddPicker((p) =>
                                  p ? { ...p, endTime: v } : p,
                                )
                              }
                            />
                          </div>
                          <button
                            onClick={() => {
                              addSchedule(
                                addPicker.dayOfWeek,
                                addPicker.startTime,
                                addPicker.endTime,
                              );
                            }}
                            style={{
                              width: "100%",
                              height: 36,
                              border: "none",
                              borderRadius: 10,
                              cursor: "pointer",
                              background:
                                "linear-gradient(135deg,#E8788A,#F0A0B0)",
                              color: "white",
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            Xác nhận
                          </button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                {daySchedules.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    {/* Time chip */}
                    <div
                      style={{
                        background: "#FFF0F2",
                        border: "1px solid #F4D8DE",
                        borderRadius: 20,
                        padding: "5px 14px",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#E8788A",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {s.startTime} – {s.endTime}
                    </div>
                    {/* Action icons */}
                    <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
                    {/* Edit button */}
                    <Popover
                      open={editPicker?.id === s.id}
                      onOpenChange={(o) => {
                        if (!o) setEditPicker(null);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          onClick={() =>
                            setEditPicker({
                              id: s.id,
                              dayOfWeek: s.dayOfWeek,
                              startTime: s.startTime,
                              endTime: s.endTime,
                            })
                          }
                          style={{
                            background: "#DBEAFE",
                            border: "none",
                            borderRadius: "50%",
                            width: 28,
                            height: 28,
                            padding: 0,
                            flexShrink: 0,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Pencil size={13} color="#3B82F6" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        style={{
                          width: 320,
                          padding: 20,
                          borderRadius: 20,
                          border: "1px solid #F4D8DE",
                          boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                          background: "white",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#2C1820",
                            margin: "0 0 16px",
                          }}
                        >
                          Sửa lịch — {dayName}
                        </p>
                        {editPicker?.id === s.id && (
                          <>
                            <div
                              style={{
                                display: "flex",
                                gap: 12,
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: 16,
                              }}
                            >
                              <TimeSpinnerCol
                                label="Bắt đầu"
                                time={editPicker.startTime}
                                onChange={(v) =>
                                  setEditPicker((p) =>
                                    p ? { ...p, startTime: v } : p,
                                  )
                                }
                              />
                              <span
                                style={{
                                  fontSize: 20,
                                  color: "#D4A0B0",
                                  marginTop: 16,
                                }}
                              >
                                →
                              </span>
                              <TimeSpinnerCol
                                label="Kết thúc"
                                time={editPicker.endTime}
                                onChange={(v) =>
                                  setEditPicker((p) =>
                                    p ? { ...p, endTime: v } : p,
                                  )
                                }
                              />
                            </div>
                            <button
                              onClick={() =>
                                editSchedule(
                                  s.id,
                                  editPicker.startTime,
                                  editPicker.endTime,
                                )
                              }
                              style={{
                                width: "100%",
                                height: 36,
                                border: "none",
                                borderRadius: 10,
                                cursor: "pointer",
                                background:
                                  "linear-gradient(135deg,#E8788A,#F0A0B0)",
                                color: "white",
                                fontWeight: 600,
                                fontSize: 13,
                              }}
                            >
                              Lưu
                            </button>
                          </>
                        )}
                      </PopoverContent>
                    </Popover>
                    {/* Delete button */}
                    <button
                      onClick={() => removeSchedule(s.id)}
                      style={{
                        background: "#FECACA",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        padding: 0,
                        flexShrink: 0,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={13} color="#EF4444" />
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Desktop: 7-column grid ── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
          }}
        >
          {DAY_NAMES.map((dayName, idx) => {
            const dow = DAY_VALUES[idx];
            const daySchedules = student.schedules.filter(
              (s) => s.dayOfWeek === dow,
            );
            const isOpen = addPicker?.dayOfWeek === dow;

            return (
              <div
                key={dow}
                style={{
                  border: "1px dashed #F4D8DE",
                  borderRadius: 12,
                  padding: 10,
                  minHeight: 140,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#A87888",
                    marginBottom: 4,
                  }}
                >
                  {dayName}
                </div>

                {daySchedules.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: "#EBF3FD",
                      border: "1px solid #BEDAF5",
                      borderRadius: 8,
                      padding: "6px 8px",
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#6B7280" }}>
                      Bắt đầu
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#3B82F6",
                      }}
                    >
                      {s.startTime}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "#6B7280", marginTop: 4 }}
                    >
                      Kết thúc
                    </div>
                    <div style={{ fontSize: 13, color: "#4B5563" }}>
                      {s.endTime}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 6,
                        justifyContent: "flex-end",
                      }}
                    >
                      {/* Edit button */}
                      <Popover
                        open={editPicker?.id === s.id}
                        onOpenChange={(o) => {
                          if (!o) setEditPicker(null);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <button
                            onClick={() =>
                              setEditPicker({
                                id: s.id,
                                dayOfWeek: s.dayOfWeek,
                                startTime: s.startTime,
                                endTime: s.endTime,
                              })
                            }
                            style={{
                              background: "#DBEAFE",
                              border: "none",
                              borderRadius: "50%",
                              width: 20,
                              height: 20,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                            }}
                          >
                            <Pencil size={10} color="#3B82F6" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          style={{
                            width: 320,
                            padding: 20,
                            borderRadius: 20,
                            border: "1px solid #F4D8DE",
                            boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                            background: "white",
                          }}
                        >
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: "#2C1820",
                              margin: "0 0 16px",
                            }}
                          >
                            Sửa lịch — {dayName}
                          </p>
                          {editPicker?.id === s.id && (
                            <>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  justifyContent: "center",
                                  alignItems: "center",
                                  marginBottom: 16,
                                }}
                              >
                                <TimeSpinnerCol
                                  label="Bắt đầu"
                                  time={editPicker.startTime}
                                  onChange={(v) =>
                                    setEditPicker((p) =>
                                      p ? { ...p, startTime: v } : p,
                                    )
                                  }
                                />
                                <span
                                  style={{
                                    fontSize: 20,
                                    color: "#D4A0B0",
                                    marginTop: 16,
                                  }}
                                >
                                  →
                                </span>
                                <TimeSpinnerCol
                                  label="Kết thúc"
                                  time={editPicker.endTime}
                                  onChange={(v) =>
                                    setEditPicker((p) =>
                                      p ? { ...p, endTime: v } : p,
                                    )
                                  }
                                />
                              </div>
                              <button
                                onClick={() =>
                                  editSchedule(
                                    s.id,
                                    editPicker.startTime,
                                    editPicker.endTime,
                                  )
                                }
                                style={{
                                  width: "100%",
                                  height: 36,
                                  border: "none",
                                  borderRadius: 10,
                                  cursor: "pointer",
                                  background:
                                    "linear-gradient(135deg,#E8788A,#F0A0B0)",
                                  color: "white",
                                  fontWeight: 600,
                                  fontSize: 13,
                                }}
                              >
                                Lưu
                              </button>
                            </>
                          )}
                        </PopoverContent>
                      </Popover>
                      {/* Delete button */}
                      <button
                        onClick={() => removeSchedule(s.id)}
                        style={{
                          background: "#FECACA",
                          border: "none",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                      >
                        <X size={10} color="#EF4444" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Combined start+end picker */}
                <Popover
                  open={isOpen}
                  onOpenChange={(o) => {
                    if (!o) setAddPicker(null);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      onClick={() =>
                        setAddPicker({
                          dayOfWeek: dow,
                          startTime: "07:00",
                          endTime: "08:00",
                        })
                      }
                      style={{
                        marginTop: "auto",
                        width: "100%",
                        height: 32,
                        background: "none",
                        border: "1px dashed #F4D8DE",
                        borderRadius: 8,
                        cursor: "pointer",
                        color: "#C4A0A8",
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    style={{
                      width: 320,
                      padding: 20,
                      borderRadius: 20,
                      border: "1px solid #F4D8DE",
                      boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                      background: "white",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#2C1820",
                        margin: "0 0 16px",
                      }}
                    >
                      Thêm lịch — {dayName}
                    </p>
                    {isOpen && addPicker && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            justifyContent: "center",
                            alignItems: "center",
                            marginBottom: 16,
                          }}
                        >
                          <TimeSpinnerCol
                            label="Bắt đầu"
                            time={addPicker.startTime}
                            onChange={(v) =>
                              setAddPicker((p) =>
                                p
                                  ? {
                                      ...p,
                                      startTime: v,
                                      endTime: addOneHour(v),
                                    }
                                  : p,
                              )
                            }
                          />
                          <span
                            style={{
                              fontSize: 20,
                              color: "#D4A0B0",
                              marginTop: 16,
                            }}
                          >
                            →
                          </span>
                          <TimeSpinnerCol
                            label="Kết thúc"
                            time={addPicker.endTime}
                            onChange={(v) =>
                              setAddPicker((p) =>
                                p ? { ...p, endTime: v } : p,
                              )
                            }
                          />
                        </div>
                        <button
                          onClick={() => {
                            addSchedule(
                              addPicker.dayOfWeek,
                              addPicker.startTime,
                              addPicker.endTime,
                            );
                          }}
                          style={{
                            width: "100%",
                            height: 36,
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            background:
                              "linear-gradient(135deg,#E8788A,#F0A0B0)",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          Xác nhận
                        </button>
                      </>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

