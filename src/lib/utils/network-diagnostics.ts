interface NetworkTestResult {
  success: boolean
  responseTime: number
  error?: string
  details?: string
}

export class NetworkDiagnostics {
  private static readonly TEST_ENDPOINTS = [
    'https://httpbin.org/get',
    'https://api.github.com',
    'https://jsonplaceholder.typicode.com/posts/1'
  ]

  /**
   * 测试基本网络连接
   */
  static async testBasicConnectivity(): Promise<NetworkTestResult> {
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5秒超时
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        return {
          success: true,
          responseTime,
          details: '基本网络连接正常'
        }
      } else {
        return {
          success: false,
          responseTime,
          error: `HTTP ${response.status}`,
          details: '网络连接异常'
        }
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          responseTime,
          error: '连接超时',
          details: '网络连接超时，可能是网络延迟或防火墙问题'
        }
      }
      
      return {
        success: false,
        responseTime,
        error: error.message,
        details: '网络连接失败'
      }
    }
  }

  /**
   * 测试 Supabase 连接
   */
  static async testSupabaseConnection(supabaseUrl: string): Promise<NetworkTestResult> {
    const startTime = Date.now()
    
    try {
      // 测试 Supabase 健康检查端点
      const healthUrl = `${supabaseUrl}/rest/v1/`
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'apikey': 'test',
          'Authorization': 'Bearer test'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      })
      
      const responseTime = Date.now() - startTime
      
      // Supabase 健康检查端点会返回 401，这是正常的
      if (response.status === 401) {
        return {
          success: true,
          responseTime,
          details: 'Supabase 服务可访问'
        }
      } else if (response.ok) {
        return {
          success: true,
          responseTime,
          details: 'Supabase 连接正常'
        }
      } else {
        return {
          success: false,
          responseTime,
          error: `HTTP ${response.status}`,
          details: 'Supabase 服务响应异常'
        }
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          responseTime,
          error: '连接超时',
          details: 'Supabase 连接超时，请检查网络或稍后重试'
        }
      }
      
      return {
        success: false,
        responseTime,
        error: error.message,
        details: '无法连接到 Supabase 服务'
      }
    }
  }

  /**
   * 测试多个端点的连接
   */
  static async testMultipleEndpoints(): Promise<NetworkTestResult[]> {
    const results = await Promise.allSettled(
      this.TEST_ENDPOINTS.map(endpoint => this.testEndpoint(endpoint))
    )
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          success: false,
          responseTime: 0,
          error: result.reason?.message || '未知错误',
          details: `测试端点 ${this.TEST_ENDPOINTS[index]} 失败`
        }
      }
    })
  }

  /**
   * 测试单个端点
   */
  private static async testEndpoint(url: string): Promise<NetworkTestResult> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      
      const responseTime = Date.now() - startTime
      
      return {
        success: response.ok,
        responseTime,
        details: response.ok ? '连接正常' : `HTTP ${response.status}`
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      return {
        success: false,
        responseTime,
        error: error.message,
        details: '连接失败'
      }
    }
  }

  /**
   * 获取网络诊断建议
   */
  static getDiagnosticAdvice(results: NetworkTestResult[]): string[] {
    const advice: string[] = []
    
    const failedTests = results.filter(r => !r.success)
    const slowTests = results.filter(r => r.success && r.responseTime > 3000)
    
    if (failedTests.length > 0) {
      advice.push('网络连接存在问题，建议检查：')
      advice.push('- 网络连接是否正常')
      advice.push('- 防火墙设置是否阻止了连接')
      advice.push('- DNS 设置是否正确')
    }
    
    if (slowTests.length > 0) {
      advice.push('网络连接较慢，建议：')
      advice.push('- 检查网络带宽')
      advice.push('- 尝试使用不同的网络')
      advice.push('- 考虑使用 VPN 或代理')
    }
    
    if (advice.length === 0) {
      advice.push('网络连接正常，如果仍有问题，请检查：')
      advice.push('- Supabase 项目配置')
      advice.push('- 环境变量设置')
      advice.push('- 浏览器缓存和 Cookie')
    }
    
    return advice
  }
}
