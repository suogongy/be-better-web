import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/client'

/**
 * 从请求头中获取用户信息
 * 用于API路由中的服务器端认证
 */
export async function getUserFromRequest(request: NextRequest) {
  try {
    // 从请求头中获取Authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization header' }
    }

    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀
    
    // 创建Supabase客户端
    const supabase = createClient()
    
    // 使用token获取用户信息
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' }
    }
    
    return { user, error: null }
  } catch (error) {
    console.error('Error getting user from request:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

/**
 * 从请求头中获取用户ID
 * 简化版本，只返回用户ID
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const { user, error } = await getUserFromRequest(request)
  if (error || !user) {
    return null
  }
  return user.id
}
