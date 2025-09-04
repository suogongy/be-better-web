// src/lib/supabase/server.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// --- Environment variables ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// --- Cached client ---
let supabaseServerClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

/**
 * Server-side Supabase client.
 * This should only be used in server components and API routes.
 */
export async function createClient() {
  if (typeof window !== 'undefined') {
    throw new Error('❌ Server client must only be used on the server')
  }

  if (!supabaseServerClient) {
    supabaseServerClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: { 'X-Client-Info': 'be-better-web-server' },
      },
      db: { schema: 'public' },
    })
  }
  
  return supabaseServerClient
}

/**
 * Server-side admin client with service role key.
 */
export async function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('❌ Admin client must only be used on the server')
  }
  
  if (!serviceRoleKey) {
    throw new Error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment')
  }

  const adminClient = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { 'X-Client-Info': 'be-better-web-admin' },
    },
    db: { schema: 'public' },
  })
  
  return adminClient
}