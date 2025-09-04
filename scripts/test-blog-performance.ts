import { createClient } from '@/lib/supabase/client'
import { BlogService } from '@/lib/supabase/services/blog-service'
import { categoryTagCache } from '@/lib/cache/category-tag-cache'

/**
 * 性能测试脚本
 * 用于对比优化前后的查询性能
 */
export async function testBlogPerformance() {
  console.log('开始博客查询性能测试...\n')
  
  // 初始化缓存
  await categoryTagCache.initialize()
  
  const testOptions = {
    page: 1,
    limit: 10,
    status: 'published' as const
  }
  
  // 测试次数
  const testRuns = 5
  
  // 1. 测试优化后的查询（使用缓存）
  console.log('=== 测试优化后的查询（单表 + 本地缓存）===')
  const optimizedTimes = []
  
  for (let i = 0; i < testRuns; i++) {
    const startTime = performance.now()
    await BlogService.getBlogList(testOptions)
    const endTime = performance.now()
    const duration = endTime - startTime
    optimizedTimes.push(duration)
    console.log(`第 ${i + 1} 次: ${duration.toFixed(2)}ms`)
  }
  
  const avgOptimized = optimizedTimes.reduce((a, b) => a + b, 0) / optimizedTimes.length
  console.log(`\n优化后平均查询时间: ${avgOptimized.toFixed(2)}ms`)
  
  // 2. 测试缓存状态
  console.log('\n=== 缓存状态 ===')
  const cacheStatus = categoryTagCache.getStatus()
  console.log('缓存状态:', JSON.stringify(cacheStatus, null, 2))
  
  // 3. 测试不同过滤条件
  console.log('\n=== 测试不同过滤条件 ===')
  
  // 测试分类过滤
  if (cacheStatus.categoriesCount > 0) {
    const firstCategory = (categoryTagCache.getCategories()[0])?.id
    if (firstCategory) {
      console.log(`\n测试分类过滤 (分类ID: ${firstCategory})`)
      const categoryStartTime = performance.now()
      await BlogService.getBlogList({ ...testOptions, categoryId: firstCategory })
      const categoryEndTime = performance.now()
      console.log(`分类过滤查询时间: ${(categoryEndTime - categoryStartTime).toFixed(2)}ms`)
    }
  }
  
  // 测试标签过滤
  if (cacheStatus.tagsCount > 0) {
    const firstTag = (categoryTagCache.getTags()[0])?.id
    if (firstTag) {
      console.log(`\n测试标签过滤 (标签ID: ${firstTag})`)
      const tagStartTime = performance.now()
      await BlogService.getBlogList({ ...testOptions, tagId: firstTag })
      const tagEndTime = performance.now()
      console.log(`标签过滤查询时间: ${(tagEndTime - tagStartTime).toFixed(2)}ms`)
    }
  }
  
  // 测试搜索
  console.log('\n测试搜索功能')
  const searchStartTime = performance.now()
  await BlogService.getBlogList({ ...testOptions, search: 'test' })
  const searchEndTime = performance.now()
  console.log(`搜索查询时间: ${(searchEndTime - searchStartTime).toFixed(2)}ms`)
  
  console.log('\n性能测试完成！')
  
  // 清理
  categoryTagCache.destroy()
}

// 如果直接运行此脚本
if (require.main === module) {
  testBlogPerformance().catch(console.error)
}