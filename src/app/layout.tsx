import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth/auth-context'
import { ThemeProvider } from '@/lib/theme/theme-context'
import { ToastProvider } from '@/components/ui/toast-provider'
import { AuthStatus } from '@/components/auth/auth-status'
import { ConditionalHeader } from '@/components/layout/conditional-header'
import { Footer } from '@/components/layout/footer'
import { CacheInitializer } from '@/components/cache-initializer'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Be Better Web",
  description: "个人博客与生产力管理平台",
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
              <AuthStatus>
                <CacheInitializer />
                <div className="min-h-screen flex flex-col">
                  <ConditionalHeader />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                </div>
              </AuthStatus>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
