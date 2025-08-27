// src/lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// --- Environment variables ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // ❌ never public

// --- Cached clients ---
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null
let supabaseAdminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

/**
 * Public Supabase client (safe for browser + server).
 */
export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
      },
      global: {
        headers: { 'X-Client-Info': 'be-better-web' },
      },
      db: { schema: 'public' },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  }
  return supabaseClient
}

/**
 * Admin Supabase client (🚨 server-side only).
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('❌ createAdminClient must only be used on the server')
  }
  if (!serviceRoleKey) {
    throw new Error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment')
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminClient
}

/**
 * Config status (useful for debugging).
 */
export function getConfigStatus() {
  return {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!serviceRoleKey,
  }
}

// Default exports
export const supabase = createClient()
// ⚠️ Only import this in server code!
export const supabaseAdmin =
  typeof window === 'undefined' ? createAdminClient() : (null as never)
