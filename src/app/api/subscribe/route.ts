import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// 验证订阅请求的 schema
const subscribeSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = subscribeSchema.parse(body)

    const supabase = createClient()

    // 检查是否已订阅
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('email', email)
      .single()

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return NextResponse.json(
          { error: '该邮箱已订阅' },
          { status: 400 }
        )
      } else {
        // 重新激活订阅
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            name: name || null,
            unsubscribed_at: null,
            confirmed_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id)

        if (error) throw error

        return NextResponse.json({
          message: '订阅已重新激活！',
        })
      }
    }

    // 生成确认令牌
    const confirmationToken = Math.random().toString(36).substring(2, 15)

    // 创建新订阅
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        email,
        name: name || null,
        status: 'active',
        confirmation_token: confirmationToken,
        confirmed_at: new Date().toISOString(),
      })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '该邮箱已订阅' },
          { status: 400 }
        )
      }
      throw error
    }

    // TODO: 发送确认邮件（需要配置邮件服务）
    // 这里可以集成 Resend、SendGrid 或其他邮件服务
    console.log(`发送确认邮件到: ${email}`)

    return NextResponse.json({
      message: '订阅成功！请查看邮箱确认订阅。',
    })
  } catch (error) {
    console.error('订阅错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '订阅失败，请稍后重试' },
      { status: 500 }
    )
  }
}

// 取消订阅
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const token = searchParams.get('token')

    if (!email || !token) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 验证令牌并取消订阅
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('email', email)
      .eq('confirmation_token', token)

    if (error) throw error

    return NextResponse.json({
      message: '已成功取消订阅',
    })
  } catch (error) {
    console.error('取消订阅错误:', error)
    return NextResponse.json(
      { error: '取消订阅失败，请稍后重试' },
      { status: 500 }
    )
  }
}