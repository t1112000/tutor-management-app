"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#FFF8FA",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ fontSize: 44 }}>😿</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#2C1820", margin: 0 }}>
          Ứng dụng gặp sự cố
        </h1>
        <p style={{ fontSize: 14, color: "#A87888", margin: 0, maxWidth: 380 }}>
          MyClass không khởi động được trang này. Thử tải lại giúp mình nha.
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
          Tải lại
        </button>
        {error.digest && (
          <code style={{ fontSize: 11, color: "#C4909A" }}>Mã lỗi: {error.digest}</code>
        )}
      </body>
    </html>
  );
}
