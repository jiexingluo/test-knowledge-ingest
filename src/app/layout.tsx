import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Knowledge Ingest System",
  description: "ATE 测试知识提取与管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-background">
          <header
            className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm"
            role="banner"
          >
            <div className="mx-auto max-w-7xl px-6 flex items-center h-14 gap-3">
              {/* Logo mark */}
              <div className="flex items-center justify-center size-7 rounded-lg bg-primary shrink-0">
                <svg
                  className="size-4 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                  />
                </svg>
              </div>

              {/* Brand text */}
              <div className="flex flex-col justify-center leading-tight">
                <h1 className="text-sm font-semibold text-foreground">
                  Knowledge Ingest
                </h1>
                <span
                  className="text-xs text-muted-foreground"
                  aria-label="工具描述"
                >
                  ATE 测试知识提取工具
                </span>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-6 py-8" role="main">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
