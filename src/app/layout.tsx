import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "MyClass - Quản lý dạy học",
  description: "Quản lý lớp học dễ dàng. Mọi thứ trong tầm tay!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "MyClass",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: APP_URL,
    title: "MyClass - Quản lý dạy học",
    description: "Quản lý lớp học dễ dàng. Mọi thứ trong tầm tay!",
    siteName: "MyClass",
    images: [{ url: "/og-image.png", width: 1672, height: 941, alt: "MyClass" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyClass - Quản lý dạy học",
    description: "Quản lý lớp học dễ dàng. Mọi thứ trong tầm tay!",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#E8788A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
