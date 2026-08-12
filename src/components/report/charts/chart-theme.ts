import type { CSSProperties } from "react";

/** MyClass report chart palette — keep in sync with ReportClient cards. */
export const CHART_COLORS = {
  paid: "#1a8a3c",
  unpaid: "#b45309",
  total: "#E8788A",
  muted: "#A87888",
  axis: "#C4A0A8",
  grid: "rgba(244, 216, 222, 0.9)",
  surface: "#FFF8FA",
} as const;

/** Compact VND for axis ticks (e.g. 1.2tr, 500k). */
export function formatChartVnd(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${trimNum(value / 1_000_000_000)}tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${trimNum(value / 1_000_000)}tr`;
  }
  if (abs >= 1_000) {
    return `${trimNum(value / 1_000)}k`;
  }
  return String(Math.round(value));
}

function trimNum(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export const chartCardStyle: CSSProperties = {
  background: "white",
  border: "1px solid #F4D8DE",
  borderRadius: "12px",
  padding: "16px 18px",
  overflow: "hidden",
};

export const chartTitleStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#2C1820",
  margin: "0 0 12px",
};
