'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportService } from '@/lib/supabase/services/index'

export function ExportRetryTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const testRetry = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🧪 开始测试重试功能...')
      
      // 测试一个不存在的导出ID
      const testId = 'test-export-id-' + Date.now()
      console.log('测试ID:', testId)
      
      await exportService.retryExport(testId)
      setResult('✅ 重试功能测试成功')
    } catch (error: any) {
      console.log('测试结果:', error)
      setResult(`❌ 测试失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testGetExport = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🧪 测试获取导出记录...')
      
      const testId = 'test-export-id-' + Date.now()
      const exportRecord = await exportService.getExportById(testId)
      
      console.log('导出记录:', exportRecord)
      setResult(`✅ 获取导出记录测试成功: ${exportRecord ? '找到记录' : '未找到记录'}`)
    } catch (error: any) {
      console.log('测试结果:', error)
      setResult(`❌ 测试失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">导出重试功能测试</h3>
      
      <div className="space-y-2">
        <Button 
          onClick={testRetry} 
          loading={loading}
          variant="outline"
        >
          测试重试功能
        </Button>
        
        <Button 
          onClick={testGetExport} 
          loading={loading}
          variant="outline"
        >
          测试获取导出记录
        </Button>
      </div>
      
      {result && (
        <div className="p-3 bg-gray-100 rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        打开浏览器控制台查看详细日志
      </div>
    </div>
  )
}
