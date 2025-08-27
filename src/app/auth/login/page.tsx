'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

// 登录表单验证模式
const loginSchema = z.object({
  email: z.string().email('请输入正确的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  // 处理表单提交
  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      clearErrors()
      console.log('🚀 登录页面: 发起登录请求 -', data.email)

      const { error } = await signIn(data.email, data.password)

      if (error) {
        console.error('❌ 登录页面: 登录失败 -', error.message)
        
        // 根据错误类型设置具体的错误信息
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = '邮箱或密码错误，请检查后重试'
          setError('email', { message: '邮箱或密码错误' })
          setError('password', { message: '邮箱或密码错误' })
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = '请先验证您的邮箱地址'
          setError('email', { message: '请先验证邮箱地址' })
        } else if (error.message.includes('Too many requests')) {
          errorMessage = '请求过于频繁，请稍后再试'
        }

        addToast({
          title: '登录失败',
          description: errorMessage,
          variant: 'destructive',
        })
      } else {
        console.log('✅ 登录页面: 登录成功，准备跳转到仪表板')
        addToast({
          title: '欢迎回来！',
          description: '您已成功登录。',
          variant: 'success',
        })
        router.push('/dashboard')
      }
    } catch (error: unknown) {
      console.error('❌ 登录页面: 意外错误 -', error instanceof Error ? error.message : '未知错误')
      addToast({
        title: '发生错误',
        description: '请稍后再试。',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            登录您的账户
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            或{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:text-primary/80">
              创建新账户
            </Link>
          </p>
        </div>

        {/* 登录表单卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>欢迎回来</CardTitle>
            <CardDescription>
              输入您的凭据以访问您的账户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 邮箱输入 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  邮箱地址
                </label>
                <div className="mt-1">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
                    placeholder="输入您的邮箱"
                    disabled={isSubmitting || authLoading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* 密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  密码
                </label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={errors.password ? 'border-red-500 focus:border-red-500 pr-10' : 'pr-10'}
                    placeholder="输入您的密码"
                    disabled={isSubmitting || authLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting || authLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* 忘记密码链接 */}
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link 
                    href="/auth/forgot-password" 
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    忘记密码？
                  </Link>
                </div>
              </div>

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || authLoading || !isValid}
              >
                {isSubmitting || authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </Button>
            </form>

            {/* 分隔线和注册链接 */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-gray-500">
                    初次使用 Be Better Web？
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/auth/register">
                  <Button variant="outline" className="w-full">
                    创建账户
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}