import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth/auth-context'
import { ThemeProvider } from '@/lib/theme/theme-context'
import { ToastProvider } from '@/components/ui/toast-provider'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Be Better Web - 个人博客与生产力管理",
  description: "一个现代化的个人网站，结合了博客管理和日常日程规划功能。",
  keywords: ["博客", "生产力", "日程安排", "规划", "个人网站"],
  authors: [{ name: "Be Better Web" }],
  openGraph: {
    title: "Be Better Web",
    description: "个人博客和生产力管理平台",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
