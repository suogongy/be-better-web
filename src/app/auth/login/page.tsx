'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

export default function LoginPage() {
  const { loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // 重定向到新的管理员登录页面
      router.replace('/admin/login')
    }
  }, [loading, router])

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">正在跳转到新的登录页面...</p>
        </div>
      </div>
    )
  }

  // 重定向中，不需要显示内容
  return null
}