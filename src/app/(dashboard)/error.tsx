"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] render error:", error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div style={{ fontSize: 40 }}>😿</div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#2C1820", margin: 0 }}>
        Có lỗi xảy ra
      </h2>
      <p style={{ fontSize: 14, color: "#A87888", margin: 0, maxWidth: 380 }}>
        Không tải được nội dung trang này. Bạn thử lại xem sao nhé.
      </p>
      <button
        onClick={reset}
        style={{
          background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
          color: "white",
          border: "none",
          borderRadius: 10,
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Thử lại
      </button>
    </div>
  );
}
