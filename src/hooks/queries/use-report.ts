import { useQuery } from "@tanstack/react-query";
import { keys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";

export type ReportSubject = "english" | "chinese";

export interface StudentReport {
  studentId: number;
  name: string;
  subject: ReportSubject;
  paid: number;
  unpaid: number;
  total: number;
  sessionsCount: number;
}

export interface Report {
  month: string;
  paid: number;
  unpaid: number;
  totalBillCount: number;
  unpaidBillCount: number;
  total: number;
  students: StudentReport[];
}

export interface BillReportRow {
  id: number;
  studentId: number;
  studentName: string;
  subject: ReportSubject;
  status: "unpaid" | "paid";
  totalAmount: number;
  month: string | null;
  startDate: string | null;
}

export interface MonthBucket {
  month: string;
  label: string;
  paid: number;
  unpaid: number;
  total: number;
  billCount: number;
}

export interface AllTimeReport {
  paid: number;
  unpaid: number;
  total: number;
  totalBillCount: number;
  unpaidBillCount: number;
  students: StudentReport[];
  bills: BillReportRow[];
  byMonth: MonthBucket[];
}

export function useReport(month: string) {
  return useQuery({
    queryKey: keys.report.month(month),
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: () => api<Report>(`/api/report?month=${month}`),
  });
}

export function useAllTimeReport(enabled = true) {
  return useQuery({
    queryKey: keys.report.all(),
    staleTime: 0,
    refetchOnMount: "always",
    enabled,
    queryFn: () => api<AllTimeReport>("/api/report?scope=all"),
  });
}
