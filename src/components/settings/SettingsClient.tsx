"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Switch } from "@/components/ui/switch";
import useIsMobile from "@/hooks/use-is-mobile";

interface Props {
  userEmail: string;
  userName: string | null;
  notificationsEnabled: boolean;
}

async function subscribePush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return null;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #F4D8DE",
  borderRadius: "12px",
  padding: "22px 24px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFF8FA",
  border: "1px solid #F4D8DE",
  borderRadius: "12px",
  padding: "9px 12px",
  fontSize: "14px",
  color: "#2C1820",
  outline: "none",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#6B4858",
  marginBottom: "6px",
};

export default function SettingsClient({ userEmail, userName, notificationsEnabled: initialEnabled }: Props) {
  const isMobile = useIsMobile();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (enabled) {
        const sub = await subscribePush();
        if (!sub) {
          toast.error("Trình duyệt không hỗ trợ hoặc quyền bị từ chối");
          return;
        }
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      } else {
        await fetch("/api/notifications/subscribe", { method: "DELETE" });
      }
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationsEnabled: enabled }),
      });
      if (!res.ok) { toast.error("Lưu thất bại"); return; }
      toast.success("Đã lưu cài đặt");
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  const hdrStyle: React.CSSProperties = {
    height: "64px", padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center",
    borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0,
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div style={hdrStyle}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#2C1820", letterSpacing: "-0.4px", margin: 0 }}>
          Cài đặt
        </h1>
      </div>

    <div style={{ padding: isMobile ? "16px" : "24px 32px", maxWidth: "560px", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Notifications */}
        <div style={cardStyle}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", marginBottom: "4px" }}>
            Thông báo nhắc nhở
          </div>
          <div style={{ fontSize: "13px", color: "#A87888", marginBottom: "20px" }}>
            Nhận nhắc nhở về lịch dạy và hóa đơn mỗi ngày
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", background: "#FFF8FA",
            border: "1px solid #F4D8DE", borderRadius: "8px", marginBottom: "12px",
          }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#2C1820" }}>Push notification</div>
              <div style={{ fontSize: "12px", color: "#A87888" }}>Bật thông báo trên trình duyệt</div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} disabled={saving} />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "10px 0",
              fontSize: "13px",
              fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
        </div>

        {/* Account info */}
        <div style={cardStyle}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820", marginBottom: "16px" }}>
            Thông tin tài khoản
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Tên giáo viên</label>
              <input style={inputStyle} type="text" defaultValue={userName ?? ""} readOnly />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="text" defaultValue={userEmail} readOnly />
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div style={cardStyle}>
          <button
            onClick={() => signOut({ callbackUrl: `${window.location.origin}/signin` })}
            style={{
              width: "100%",
              background: "#FFF8FA",
              color: "#E8788A",
              border: "1px solid #F4D8DE",
              borderRadius: "10px",
              padding: "12px 0",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FFE8EE";
              e.currentTarget.style.borderColor = "#E8788A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFF8FA";
              e.currentTarget.style.borderColor = "#F4D8DE";
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
