import { createClient } from '@/lib/supabase/client'

async function checkCommentsData() {
  const supabase = createClient()
  
  try {
    // 检查是否有评论数据
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .limit(10)
    
    if (error) {
      console.error('获取评论数据失败:', error)
      return
    }
    
    console.log('评论数据:', comments)
    console.log('评论总数:', comments?.length || 0)
    
    // 检查已批准的评论
    const { data: approvedComments, error: approvedError } = await supabase
      .from('comments')
      .select('*')
      .eq('status', 'approved')
      .limit(10)
    
    if (approvedError) {
      console.error('获取已批准评论失败:', approvedError)
      return
    }
    
    console.log('已批准评论:', approvedComments)
    console.log('已批准评论总数:', approvedComments?.length || 0)
    
    // 检查每篇文章的评论数
    const { data: commentCounts, error: countError } = await supabase
      .from('comments')
      .select('post_id, count')
      .eq('status', 'approved')
    
    if (countError) {
      console.error('获取评论数失败:', countError)
      return
    }
    
    console.log('评论数统计:', commentCounts)
    
  } catch (error) {
    console.error('检查评论数据时出错:', error)
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  checkCommentsData()
}

export { checkCommentsData }