"use client";

import { useMemo } from "react";
import { barY, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/charts/react";
import type { MonthBucket } from "@/hooks/queries/use-report";
import {
  CHART_COLORS,
  chartCardStyle,
  chartTitleStyle,
  formatChartVnd,
} from "./chart-theme";

interface ReportMonthlyTrendChartProps {
  byMonth: MonthBucket[];
  height?: number;
}

export function ReportMonthlyTrendChart({
  byMonth,
  height = 260,
}: ReportMonthlyTrendChartProps) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(byMonth, {
            x: "label",
            y: "total",
            fill: CHART_COLORS.total,
            radius: 5,
            maxThickness: 40,
          }),
        ],
        x: {
          scale: () => scaleBand<string>().padding(0.25),
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: {
            label: "Tổng",
            ticks: { format: (v) => formatChartVnd(Number(v)) },
          },
        },
        tooltip,
      }),
    [byMonth]
  );

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Doanh thu theo tháng</h3>
      <Chart
        definition={definition}
        height={height}
        ariaLabel="Biểu đồ tổng tiền hóa đơn theo tháng"
      />
    </div>
  );
}
