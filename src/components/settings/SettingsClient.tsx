"use client";

import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  userEmail: string;
  userName: string | null;
}

export default function SettingsClient({ userEmail, userName }: Props) {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt</h1>

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
