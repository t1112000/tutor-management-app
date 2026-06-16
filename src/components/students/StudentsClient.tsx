"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubjectBadge } from "@/components/ui/subject-badge";
import AddStudentDialog from "./AddStudentDialog";

interface Student {
  id: number;
  name: string;
  subject: "english" | "chinese";
  phone: string | null;
  bills?: Array<{ id: number }>;
}

export default function StudentsClient() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function load(q = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/students${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function onSearch(q: string) {
    setSearch(q);
    const timer = setTimeout(() => load(q), 300);
    return () => clearTimeout(timer);
  }

  const initials = (name: string) =>
    name.trim().split(" ").map((n) => n[0]).slice(-1).join("").toUpperCase();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Học sinh</h1>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm học sinh
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9 max-w-sm"
          placeholder="Tìm theo tên, số điện thoại..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-pink-50/60 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">TÊN HỌC SINH</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">MÔN HỌC</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">SĐT</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">SỐ HÓA ĐƠN</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Đang tải...</td></tr>
            ) : !students.length ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Chưa có học sinh nào</td></tr>
            ) : students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                      {initials(s.name)}
                    </div>
                    <span className="font-medium text-gray-900">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4"><SubjectBadge subject={s.subject} /></td>
                <td className="px-4 py-4 text-gray-600 text-sm">{s.phone ?? "—"}</td>
                <td className="px-4 py-4 text-gray-600 text-sm">{s.bills?.length ?? 0} hóa đơn</td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => router.push(`/students/${s.id}`)}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Xem chi tiết →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddStudentDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreated={() => { setShowAdd(false); load(search); }}
      />
    </div>
  );
}
