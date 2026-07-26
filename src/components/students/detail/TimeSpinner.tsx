"use client";

import { useState } from "react";

// ── Inline time spinner col with click-to-type ──────────────────────────────
const SCHED_MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function parseHM(t: string): [number, number] {
  const [h, m] = t.split(":").map(Number);
  return [h ?? 7, m ?? 0];
}

export function toTimeStr(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function TimeSpinnerCol({
  time,
  onChange,
  label,
}: {
  time: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const [h, m] = parseHM(time);
  const mIdx = Math.max(
    0,
    SCHED_MINS.findIndex((x) => x === m),
  );
  const [editH, setEditH] = useState(false);
  const [editM, setEditM] = useState(false);
  const [hVal, setHVal] = useState("");
  const [mVal, setMVal] = useState("");

  const btn: React.CSSProperties = {
    width: 44,
    height: 30,
    background: "#F8F0F4",
    border: "1px solid #F4D8DE",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 11,
    color: "#A87888",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const box: React.CSSProperties = {
    width: 56,
    height: 52,
    background: "#F8F0F4",
    border: "1px solid #F4D8DE",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    fontWeight: 700,
    color: "#2C1820",
    cursor: "text",
  };
  const editBox: React.CSSProperties = {
    ...box,
    border: "2px solid #E8788A",
    outline: "none",
    textAlign: "center",
    background: "#FFF8FA",
  };

  function commitH(val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n)) onChange(toTimeStr(Math.max(0, Math.min(23, n)), m));
    setEditH(false);
  }
  function commitM(val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n)) {
      const nearest = SCHED_MINS.reduce((p, c) =>
        Math.abs(c - n) < Math.abs(p - n) ? c : p,
      );
      onChange(toTimeStr(h, nearest));
    }
    setEditM(false);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#A87888",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
        {/* Hours */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <button
            style={btn}
            onClick={() => onChange(toTimeStr((h + 1) % 24, m))}
          >
            ▲
          </button>
          {editH ? (
            <input
              autoFocus
              style={editBox as React.CSSProperties}
              value={hVal}
              onChange={(e) => setHVal(e.target.value)}
              onBlur={() => commitH(hVal)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitH(hVal);
                if (e.key === "Escape") setEditH(false);
              }}
            />
          ) : (
            <div
              style={box}
              onClick={() => {
                setHVal(String(h).padStart(2, "0"));
                setEditH(true);
              }}
            >
              {String(h).padStart(2, "0")}
            </div>
          )}
          <button
            style={btn}
            onClick={() => onChange(toTimeStr((h - 1 + 24) % 24, m))}
          >
            ▼
          </button>
          <span style={{ fontSize: 10, color: "#A87888", marginTop: 2 }}>
            giờ
          </span>
        </div>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#2C1820",
            paddingTop: 34,
            lineHeight: 1,
          }}
        >
          :
        </span>
        {/* Minutes */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <button
            style={btn}
            onClick={() =>
              onChange(toTimeStr(h, SCHED_MINS[(mIdx + 1) % SCHED_MINS.length]))
            }
          >
            ▲
          </button>
          {editM ? (
            <input
              autoFocus
              style={editBox as React.CSSProperties}
              value={mVal}
              onChange={(e) => setMVal(e.target.value)}
              onBlur={() => commitM(mVal)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitM(mVal);
                if (e.key === "Escape") setEditM(false);
              }}
            />
          ) : (
            <div
              style={box}
              onClick={() => {
                setMVal(String(SCHED_MINS[mIdx]).padStart(2, "0"));
                setEditM(true);
              }}
            >
              {String(SCHED_MINS[mIdx]).padStart(2, "0")}
            </div>
          )}
          <button
            style={btn}
            onClick={() =>
              onChange(
                toTimeStr(
                  h,
                  SCHED_MINS[
                    (mIdx - 1 + SCHED_MINS.length) % SCHED_MINS.length
                  ],
                ),
              )
            }
          >
            ▼
          </button>
          <span style={{ fontSize: 10, color: "#A87888", marginTop: 2 }}>
            phút
          </span>
        </div>
      </div>
    </div>
  );
}

