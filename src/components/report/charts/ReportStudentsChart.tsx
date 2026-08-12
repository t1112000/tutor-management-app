"use client";

import { useMemo } from "react";
import { barY, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/charts/react";
import type { StudentReport } from "@/hooks/queries/use-report";
import {
  CHART_COLORS,
  chartCardStyle,
  chartTitleStyle,
  formatChartVnd,
} from "./chart-theme";

interface ReportStudentsChartProps {
  students: StudentReport[];
  /** Max bars to show (highest totals). */
  limit?: number;
  height?: number;
}

export function ReportStudentsChart({
  students,
  limit = 6,
  height = 260,
}: ReportStudentsChartProps) {
  const rows = useMemo(() => {
    return [...students]
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
      .map((s) => ({
        name: s.name.length > 14 ? `${s.name.slice(0, 12)}…` : s.name,
        total: s.total,
      }));
  }, [students, limit]);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(rows, {
            x: "name",
            y: "total",
            fill: CHART_COLORS.paid,
            radius: 5,
            maxThickness: 40,
          }),
        ],
        x: {
          scale: () => scaleBand<string>().padding(0.3),
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

  if (rows.length === 0) return null;

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Top học sinh theo tổng hóa đơn</h3>
      <Chart
        definition={definition}
        height={height}
        ariaLabel="Biểu đồ tổng hóa đơn theo học sinh"
      />
    </div>
  );
}
