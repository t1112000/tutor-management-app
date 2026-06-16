"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  userEmail: string;
  userName: string | null;
  notificationsEnabled: boolean;
}

export default function SettingsClient({ userEmail, userName, notificationsEnabled: initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function save(value: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationsEnabled: value }),
      });
      if (!res.ok) { toast.error("Lưu thất bại"); return; }
      setEnabled(value);
      toast.success("Đã lưu cài đặt");
    } finally {
      setSaving(false);
    }
  }

  async function testReminder() {
    setTesting(true);
    try {
      await fetch("/api/notifications/test", { method: "POST" });
      toast.success("Đã chạy nhắc nhở thủ công");
    } catch {
      toast.error("Thất bại");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt</h1>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-gray-900">Thông báo nhắc nhở</h2>
        </div>
        <p className="text-sm text-gray-400 mb-5">Tự động nhắc lịch dạy lúc 7:00 sáng mỗi ngày</p>

        <div className="bg-pink-50/50 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Bật nhắc nhở hàng ngày</div>
            <div className="text-xs text-gray-400">7:00 sáng — Asia/Ho_Chi_Minh</div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={save}
            disabled={saving}
          />
        </div>

        <Button variant="outline" onClick={testReminder} disabled={testing} className="w-full">
          {testing ? "Đang chạy..." : "Chạy thử nhắc nhở"}
        </Button>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-gray-900">Thông tin tài khoản</h2>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Tên</Label>
            <Input value={userName ?? ""} disabled className="bg-gray-50" />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={userEmail} disabled className="bg-gray-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
