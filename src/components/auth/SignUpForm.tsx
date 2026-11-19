"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, Lock, UserCircle, Loader2 } from "lucide-react";

type AccountType = "tutor" | "reseller";

export default function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("tutor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, accountType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Có lỗi xảy ra" }));
        setError(body.error ?? "Có lỗi xảy ra");
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Đăng ký thành công nhưng đăng nhập thất bại, vui lòng đăng nhập lại.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#FFF8FA",
    border: "1px solid #F4D8DE",
    borderRadius: "12px",
    padding: "9px 12px 9px 36px",
    fontSize: "14px",
    color: "#2C1820",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(244,216,222,0.8)",
          borderRadius: "24px",
          padding: "40px 36px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 24px 64px rgba(200,80,100,0.12), 0 4px 16px rgba(200,80,100,0.08)",
        }}
      >
        <div className="flex flex-col items-center" style={{ marginBottom: "28px" }}>
          <Image
            src="/logo-myclass.webp"
            alt="MyClass"
            width={640}
            height={427}
            style={{ width: "140px", height: "auto", marginBottom: "6px" }}
          />
          <p style={{ fontSize: "13px", color: "#A87888", marginTop: "2px" }}>
            Tạo tài khoản mới
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px" }}>
              Họ tên
            </label>
            <div className="relative">
              <UserCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#A87888" }} />
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px" }}>
              Email
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#A87888" }} />
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px" }}>
              Mật khẩu
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#A87888" }} />
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "8px" }}>
              Loại tài khoản
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {(
                [
                  { value: "tutor", label: "Dạy học" },
                  { value: "reseller", label: "Bán hàng" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "9px 0",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: accountType === opt.value ? "1px solid #E8788A" : "1px solid #F4D8DE",
                    background: accountType === opt.value ? "rgba(232,120,138,0.10)" : "#FFF8FA",
                    color: accountType === opt.value ? "#E8788A" : "#6B4858",
                  }}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value={opt.value}
                    checked={accountType === opt.value}
                    onChange={() => setAccountType(opt.value)}
                    style={{ display: "none" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#E8788A", textAlign: "center" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "10px 0",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 16px rgba(232,120,138,0.40)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              letterSpacing: "-0.2px",
              transition: "transform 120ms ease, box-shadow 120ms ease",
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Đăng ký
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "12px", color: "#A87888" }}>
          Đã có tài khoản?{" "}
          <Link href="/signin" style={{ color: "#E8788A", fontWeight: 600, textDecoration: "none" }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
