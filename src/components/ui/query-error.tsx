"use client";

/**
 * Shown when a query fails. Without it the detail pages sat on "Đang tải..."
 * forever and the lists rendered their empty state — for a money-tracking app,
 * a network failure that looks like "0 đ" is worse than an error message.
 */
export function QueryErrorState({
  message = "Không tải được dữ liệu",
  onRetry,
  compact = false,
}: {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: compact ? "28px 16px" : "56px 16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: compact ? 26 : 34 }}>😿</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#2C1820" }}>{message}</div>
      <div style={{ fontSize: 12.5, color: "#A87888", maxWidth: 320 }}>
        Kiểm tra kết nối mạng rồi thử lại nhé.
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 4,
            background: "#FFF8FA",
            color: "#E8788A",
            border: "1px solid #F4D8DE",
            borderRadius: 10,
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
