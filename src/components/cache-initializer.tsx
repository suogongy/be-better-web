'use client'

import { useEffect } from 'react'
import { initializeCategoryTagCache } from '@/lib/cache/category-tag-cache'

export function CacheInitializer() {
  useEffect(() => {
    // 初始化分类和标签缓存
    initializeCategoryTagCache().catch(console.error)
  }, [])

  return null
}