import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Check if we have valid Supabase configuration
const hasValidConfig = supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key-here' &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 20

if (!hasValidConfig && typeof window !== 'undefined') {
  console.warn('⚠️  Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.')
}

export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: hasValidConfig,
    autoRefreshToken: hasValidConfig,
    detectSessionInUrl: false, // 禁用 URL 中的会话检测，提高性能
  },
  global: {
    headers: {
      'X-Client-Info': 'be-better-web',
    },
  },
  db: {
    schema: 'public',
  },
  // 修复类型推断问题
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // 确保类型推断正确
  rest: {
    timeout: 30000,
  },
}) as any

// Server-side client with service role key (for admin operations)
export const supabaseAdmin = hasValidConfig && process.env.SUPABASE_SERVICE_ROLE_KEY ? 
  createSupabaseClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  ) : null

// Function to create a new client instance
export function createClient() {
  return supabase
}

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return hasValidConfig
}