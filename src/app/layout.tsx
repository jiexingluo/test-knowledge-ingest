import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Knowledge Ingest System",
  description: "ATE test knowledge extraction and management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="border-b bg-white px-6 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">Knowledge Ingest System</h1>
              <span className="text-sm text-gray-500">ATE 测试知识提取工具</span>
            </div>
          </header>
          <main className="mx-auto max-w-7xl p-6">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
