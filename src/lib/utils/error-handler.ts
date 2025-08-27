/**
 * 安全地获取错误对象的 message 属性
 * @param error 未知类型的错误对象
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * 安全地获取错误对象的 name 属性
 * @param error 未知类型的错误对象
 * @returns 错误名称字符串
 */
export function getErrorName(error: unknown): string {
  if (error instanceof Error) {
    return error.name
  }
  return 'Error'
}

/**
 * 检查错误是否为网络错误
 * @param error 未知类型的错误对象
 * @returns 是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error)
  const name = getErrorName(error)
  return message?.includes('fetch') || name === 'TypeError' || message?.includes('Failed to fetch') || message?.includes('network')
}

/**
 * 检查错误是否为超时错误
 * @param error 未知类型的错误对象
 * @returns 是否为超时错误
 */
export function isTimeoutError(error: unknown): boolean {
  const message = getErrorMessage(error)
  return message?.includes('timeout') || message?.includes('Session check timeout')
}