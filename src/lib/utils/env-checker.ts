interface EnvCheckResult {
  isValid: boolean
  issues: string[]
  warnings: string[]
  suggestions: string[]
}

export class EnvChecker {
  /**
   * 检查 Supabase 环境变量配置
   */
  static checkSupabaseConfig(): EnvCheckResult {
    const issues: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // 检查 URL 配置
    if (!supabaseUrl) {
      issues.push('NEXT_PUBLIC_SUPABASE_URL 未设置')
    } else if (supabaseUrl === 'https://your-project.supabase.co') {
      issues.push('NEXT_PUBLIC_SUPABASE_URL 仍为默认值，请更新为实际的 Supabase 项目 URL')
    } else if (!supabaseUrl.includes('.supabase.co')) {
      warnings.push('NEXT_PUBLIC_SUPABASE_URL 格式可能不正确，应该包含 .supabase.co')
    } else if (!supabaseUrl.startsWith('https://')) {
      issues.push('NEXT_PUBLIC_SUPABASE_URL 应该使用 HTTPS 协议')
    }

    // 检查密钥配置
    if (!supabaseAnonKey) {
      issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY 未设置')
    } else if (supabaseAnonKey === 'your-anon-key-here') {
      issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY 仍为默认值，请更新为实际的匿名密钥')
    } else if (supabaseAnonKey.length < 20) {
      warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY 长度异常，可能配置错误')
    }

    // 检查服务角色密钥（可选）
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      suggestions.push('建议设置 SUPABASE_SERVICE_ROLE_KEY 以支持管理员操作')
    } else if (serviceRoleKey === 'your-service-role-key-here') {
      warnings.push('SUPABASE_SERVICE_ROLE_KEY 仍为默认值')
    }

    // 检查环境
    const nodeEnv = process.env.NODE_ENV
    if (nodeEnv === 'production') {
      suggestions.push('生产环境：确保所有环境变量都已正确配置')
    } else if (nodeEnv === 'development') {
      suggestions.push('开发环境：确保 .env.local 文件存在且配置正确')
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      suggestions
    }
  }

  /**
   * 获取环境变量摘要
   */
  static getEnvSummary(): Record<string, string> {
    return {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : '未设置',
      'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? 
        `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : '未设置',
      'NODE_ENV': process.env.NODE_ENV || '未设置'
    }
  }

  /**
   * 验证 Supabase 配置是否有效
   */
  static isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    return !!(
      url && 
      key && 
      url !== 'https://your-project.supabase.co' && 
      key !== 'your-anon-key-here' &&
      url.includes('.supabase.co') &&
      key.length > 20
    )
  }

  /**
   * 获取配置建议
   */
  static getConfigurationAdvice(): string[] {
    const advice: string[] = []
    const check = this.checkSupabaseConfig()

    if (!check.isValid) {
      advice.push('配置问题需要解决：')
      check.issues.forEach(issue => advice.push(`- ${issue}`))
    }

    if (check.warnings.length > 0) {
      advice.push('配置警告：')
      check.warnings.forEach(warning => advice.push(`- ${warning}`))
    }

    if (check.suggestions.length > 0) {
      advice.push('配置建议：')
      check.suggestions.forEach(suggestion => advice.push(`- ${suggestion}`))
    }

    if (advice.length === 0) {
      advice.push('环境变量配置看起来正常')
    }

    return advice
  }
}
