'use client'

import { useState, useEffect } from 'react'
import { commentService } from '@/lib/supabase/services/index'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MessageCircle, Check, X as XIcon, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function DebugComments() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const targetPostId = '0d0d53c8-d94d-45a6-b11e-4d0671d88dd0'

  useEffect(() => {
    async function debugComments() {
      try {
        setLoading(true)
        setError(null)
        
        const info: any = {
          postId: targetPostId,
          timestamp: new Date().toISOString()
        }

        // 1. 检查文章是否存在
        console.log('🔍 检查文章存在性...')
        const { data: post, error: postError } = await supabase
          .from('posts')
          .select('id, title, slug')
          .eq('id', targetPostId)
          .single()
        
        info.post = post || null
        info.postError = postError || null
        
        if (postError || !post) {
          setDebugInfo(info)
          setError('文章不存在或查询失败')
          return
        }

        // 2. 查询所有评论(不过滤状态)
        console.log('🔍 查询所有评论...')
        const { data: allComments, error: allError } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', targetPostId)
          .order('created_at', { ascending: true })
        
        info.allComments = allComments || []
        info.allCommentsError = allError || null
        info.totalComments = allComments?.length || 0

        // 3. 测试 commentService.getComments 方法
        console.log('🔍 测试 commentService.getComments...')
        try {
          const serviceComments = await commentService.getComments(targetPostId, {
            status: 'approved',
            includeReplies: false,
          })
          info.serviceComments = serviceComments
          info.serviceCommentsCount = serviceComments.length
        } catch (serviceError) {
          info.serviceError = serviceError
        }

        // 4. 查询已批准的顶级评论
        console.log('🔍 查询已批准的顶级评论...')
        const { data: approvedComments, error: approvedError } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', targetPostId)
          .eq('status', 'approved')
          .is('parent_id', null)
          .order('created_at', { ascending: true })
        
        info.approvedComments = approvedComments || []
        info.approvedCommentsError = approvedError || null
        info.approvedCount = approvedComments?.length || 0

        // 5. 统计各状态评论数量
        const statusStats: any = {}
        allComments?.forEach((comment: any) => {
          statusStats[comment.status] = (statusStats[comment.status] || 0) + 1
        })
        info.statusStats = statusStats

        // 6. 分析顶级评论和回复
        const topLevel = allComments?.filter((c: any) => !c.parent_id) || []
        const replies = allComments?.filter((c: any) => c.parent_id) || []
        
        info.topLevelCount = topLevel.length
        info.repliesCount = replies.length
        info.topLevelComments = topLevel
        info.replies = replies

        setDebugInfo(info)
        console.log('✅ 调试信息收集完成', info)
        
      } catch (err: any) {
        console.error('💥 调试过程出错:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    debugComments()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">调试评论加载问题</h1>
          <p>正在收集调试信息...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-red-600">调试失败</h1>
          <p className="text-red-500">{error}</p>
          {debugInfo && (
            <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">评论加载调试信息</h1>
        
        {debugInfo && (
          <div className="space-y-6">
            {/* 基础信息 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="font-semibold mb-2">📋 基础信息</h2>
              <p><strong>目标文章ID:</strong> {debugInfo.postId}</p>
              <p><strong>调试时间:</strong> {debugInfo.timestamp}</p>
              {debugInfo.post && (
                <>
                  <p><strong>文章标题:</strong> {debugInfo.post.title}</p>
                  <p><strong>文章Slug:</strong> {debugInfo.post.slug}</p>
                </>
              )}
            </div>

            {/* 评论统计 */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="font-semibold mb-2">📊 评论统计</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">总评论数</p>
                  <p className="text-2xl font-bold">{debugInfo.totalComments}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">已批准</p>
                  <p className="text-2xl font-bold text-green-600">{debugInfo.approvedCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">顶级评论</p>
                  <p className="text-2xl font-bold">{debugInfo.topLevelCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">回复数</p>
                  <p className="text-2xl font-bold">{debugInfo.repliesCount}</p>
                </div>
              </div>
              
              {debugInfo.statusStats && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">各状态评论数量:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(debugInfo.statusStats).map(([status, count]: [string, any]) => (
                      <span key={status} className="px-2 py-1 bg-gray-200 rounded text-sm">
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CommentService 测试结果 */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="font-semibold mb-2">🔧 CommentService 测试</h2>
              {debugInfo.serviceError ? (
                <div className="text-red-600">
                  <p><strong>❌ 服务调用失败:</strong> {debugInfo.serviceError.message}</p>
                </div>
              ) : (
                <div>
                  <p><strong>✅ 服务调用成功</strong></p>
                  <p><strong>返回评论数:</strong> {debugInfo.serviceCommentsCount || 0}</p>
                  {debugInfo.serviceComments && debugInfo.serviceComments.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">返回的评论:</p>
                      <ul className="text-sm mt-1 space-y-1">
                        {debugInfo.serviceComments.map((comment: any) => (
                          <li key={comment.id} className="pl-2 border-l-2 border-gray-300">
                            <strong>{comment.author_name}:</strong> {comment.content.substring(0, 100)}...
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 详细评论列表 */}
            {debugInfo.allComments && debugInfo.allComments.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="font-semibold mb-2">📝 所有评论详情</h2>
                <div className="space-y-3">
                  {debugInfo.allComments.map((comment: any, index: number) => (
                    <div key={comment.id} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{index + 1}. {comment.author_name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          comment.status === 'approved' ? 'bg-green-100 text-green-800' :
                          comment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          comment.status === 'spam' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {comment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        ID: {comment.id} | 父评论: {comment.parent_id || '无'}
                      </p>
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        创建时间: {comment.created_at}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 原始数据 */}
            <details className="bg-gray-100 p-4 rounded-lg">
              <summary className="font-semibold cursor-pointer">🔧 原始调试数据 (点击展开)</summary>
              <pre className="mt-2 text-xs overflow-auto max-h-96 bg-white p-2 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}