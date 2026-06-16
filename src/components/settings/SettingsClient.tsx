"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  userId: number;
  userEmail: string;
}

export default function SettingsClient({ userId, userEmail }: Props) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState(userEmail);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    setPushSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  async function subscribePush() {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setPushEnabled(true);
      toast.success("Đã bật thông báo push");
    } catch {
      toast.error("Không thể bật thông báo push");
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pushEnabled, emailEnabled, notificationEmail }),
      });
      if (!res.ok) { toast.error("Lưu thất bại"); return; }
      toast.success("Đã lưu cài đặt");
    } finally {
      setSaving(false);
    }
  }

  async function testNotification() {
    setTesting(true);
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();
      toast.success(`Gửi thử: ${data.results?.join(", ") || "ok"}`);
    } catch {
      toast.error("Gửi thử thất bại");
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
        <p className="text-sm text-gray-400 mb-5">Nhận nhắc nhở về lịch dạy và hóa đơn mỗi ngày</p>

        {/* Push toggle */}
        <div className="bg-pink-50/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Push notification</div>
              <div className="text-xs text-gray-400">Bật thông báo trên trình duyệt</div>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={(v) => {
                if (v && pushSupported) subscribePush();
                else setPushEnabled(v);
              }}
              disabled={!pushSupported}
            />
          </div>
          {!pushSupported && (
            <p className="text-xs text-gray-400 mt-2">Trình duyệt không hỗ trợ push notification</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1 mb-4">
          <Label>Email nhận thông báo</Label>
          <Input
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={saveSettings} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
          <Button variant="outline" onClick={testNotification} disabled={testing}>
            {testing ? "Đang gửi..." : "Gửi thử"}
          </Button>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-gray-900">Thông tin tài khoản</h2>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={userEmail} disabled className="bg-gray-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
