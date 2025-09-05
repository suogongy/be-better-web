'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Header } from '@/components/layout/header'
import { AdminHeader } from '@/components/layout/admin-header'

export function ConditionalHeader() {
  const { user } = useAuth()
  
  if (user) {
    return <AdminHeader />
  }
  
  return <Header />
}