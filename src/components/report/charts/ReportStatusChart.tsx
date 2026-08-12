"use client";

import { useMemo } from "react";
import { barY, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/charts/react";
import { formatMoneyVND } from "@/lib/time";
import { statusBreakdown } from "@/lib/report";
import {
  CHART_COLORS,
  chartCardStyle,
  chartTitleStyle,
  formatChartVnd,
} from "./chart-theme";

interface ReportStatusChartProps {
  paid: number;
  unpaid: number;
  height?: number;
}

export function ReportStatusChart({ paid, unpaid, height = 240 }: ReportStatusChartProps) {
  const rows = useMemo(() => statusBreakdown(paid, unpaid), [paid, unpaid]);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(rows, {
            x: "status",
            y: "amount",
            fill: (d) => (d.status === "Đã thu" ? CHART_COLORS.paid : CHART_COLORS.unpaid),
            radius: 6,
            maxThickness: 56,
          }),
        ],
        x: {
          scale: () => scaleBand<string>().padding(0.35),
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: {
            ticks: { format: (v) => formatChartVnd(Number(v)) },
          },
        },
        tooltip,
      }),
    [rows]
  );

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Đã thu / Chưa thu</h3>
      <Chart
        definition={definition}
        height={height}
        ariaLabel={`Đã thu ${formatMoneyVND(paid)}, chưa thu ${formatMoneyVND(unpaid)}`}
      />
    </div>
  );
}
