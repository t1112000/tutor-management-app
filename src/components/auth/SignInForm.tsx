"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, Loader2 } from "lucide-react";

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Email hoặc mật khẩu không đúng.");
      } else {
        router.push("/");
        router.refresh();
      }
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
        {/* Logo — the image already contains "MyClass" text */}
        <div className="flex flex-col items-center" style={{ marginBottom: "32px" }}>
          <Image
            src="/logo-myclass.png"
            alt="MyClass"
            width={160}
            height={160}
            style={{ width: "160px", height: "auto", marginBottom: "6px" }}
          />
          <p style={{ fontSize: "13px", color: "#A87888", marginTop: "2px" }}>
            Quản lý dạy học thông minh
          </p>
        </div>

        {/* Fields */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B4858", marginBottom: "6px" }}>
              Email / Số điện thoại
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
                onFocus={(e) => { e.target.style.borderColor = "#E8788A"; e.target.style.boxShadow = "0 0 0 2px rgba(232,120,138,0.15)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#F4D8DE"; e.target.style.boxShadow = "none"; }}
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#E8788A"; e.target.style.boxShadow = "0 0 0 2px rgba(232,120,138,0.15)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#F4D8DE"; e.target.style.boxShadow = "none"; }}
              />
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
            Đăng nhập
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "12px", color: "#A87888" }}>
          Quên mật khẩu?{" "}
          <a
            href="https://www.facebook.com/yuumiiiiiiii/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#E8788A", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
          >
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  );
}
