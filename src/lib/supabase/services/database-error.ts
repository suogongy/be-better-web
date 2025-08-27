/**
 * 数据库操作错误类
 * 统一处理数据库相关错误
 */
export class DatabaseError extends Error {
  /**
   * 创建数据库错误实例
   * @param message 错误消息
   * @param originalError 原始错误对象
   * @param details 错误详情
   */
  constructor(
    message: string,
    public originalError?: Error,
    public details?: unknown
  ) {
    super(message)
    this.name = 'DatabaseError'
    
    // 保持正确的原型链
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }

  /**
   * 获取完整的错误信息
   * @returns 包含原始错误信息的字符串
   */
  getFullMessage(): string {
    let fullMessage = this.message
    
    if (this.originalError) {
      fullMessage += ` (Original error: ${this.originalError.message})`
    }
    
    if (this.details) {
      fullMessage += ` (Details: ${JSON.stringify(this.details)})`
    }
    
    return fullMessage
  }

  /**
   * 转换为标准错误对象
   * @returns 标准JavaScript错误对象
   */
  toStandardError(): Error {
    const error = new Error(this.getFullMessage())
    error.name = this.name
    error.stack = this.stack
    return error
  }
}