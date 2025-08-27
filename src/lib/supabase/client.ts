import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// 环境变量配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 客户端实例缓存
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null
let supabaseAdminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

/**
 * 创建 Supabase 客户端
 * @returns Supabase 客户端实例
 * @throws 如果配置无效则抛出错误
 */
export function createClient(): ReturnType<typeof createSupabaseClient<Database>> {

  // 在服务端总是创建新实例
  if (typeof window === 'undefined') {
    return createSupabaseClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'be-better-web',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  // 创建并缓存客户端实例
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'be-better-web',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  return supabaseClient
}

/**
 * 创建管理员客户端（用于服务器端操作）
 * @returns 管理员客户端实例或 null
 */
export function createAdminClient(): ReturnType<typeof createSupabaseClient<Database>> {

  // 在服务端总是创建新实例
  if (typeof window === 'undefined') {
    return createSupabaseClient<Database>(supabaseUrl!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  // 在浏览器端使用缓存的实例
  if (supabaseAdminClient) {
    return supabaseAdminClient
  }

  supabaseAdminClient = createSupabaseClient<Database>(supabaseUrl!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdminClient
}

/**
 * 获取配置状态信息
 * @returns 配置状态对象
 */
export function getConfigStatus() {
  return {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!serviceRoleKey,
    isValid: isConfigValid(),
  }
}

// 向后兼容的导出
export const supabase = isConfigValid() ? createClient() : null
export const supabaseAdmin = createAdminClient()