import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-red-500 text-2xl">&#x2717;</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Email của bạn chưa được cấp quyền. Liên hệ quản trị viên.
        </p>
        <Link
          href="/signin"
          className="inline-block bg-primary text-white rounded-xl px-6 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Quay lại
        </Link>
      </div>
    </div>
  );
}
