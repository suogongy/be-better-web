/**
 * Performance optimization middleware for Next.js
 * Provides request-level performance monitoring and optimization
 */

import { NextRequest, NextResponse } from 'next/server'

export interface PerformanceMetrics {
  startTime: number
  endTime?: number
  duration?: number
  route: string
  method: string
  statusCode?: number
  contentLength?: number
  userAgent?: string
  ip?: string
}

class PerformanceTracker {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private aggregatedMetrics: {
    totalRequests: number
    averageResponseTime: number
    errorRate: number
    routePerformance: Record<string, {
      count: number
      totalTime: number
      errors: number
    }>
  } = {
    totalRequests: 0,
    averageResponseTime: 0,
    errorRate: 0,
    routePerformance: {}
  }

  startTracking(requestId: string, route: string, method: string, userAgent?: string, ip?: string): void {
    this.metrics.set(requestId, {
      startTime: Date.now(),
      route,
      method,
      userAgent,
      ip
    })
  }

  endTracking(requestId: string, statusCode: number, contentLength?: number): PerformanceMetrics | null {
    const metric = this.metrics.get(requestId)
    if (!metric) return null

    metric.endTime = Date.now()
    metric.duration = metric.endTime - metric.startTime
    metric.statusCode = statusCode
    metric.contentLength = contentLength

    this.updateAggregatedMetrics(metric)
    this.metrics.delete(requestId)

    return metric
  }

  private updateAggregatedMetrics(metric: PerformanceMetrics): void {
    this.aggregatedMetrics.totalRequests++

    // Update route performance
    if (!this.aggregatedMetrics.routePerformance[metric.route]) {
      this.aggregatedMetrics.routePerformance[metric.route] = {
        count: 0,
        totalTime: 0,
        errors: 0
      }
    }

    const routeStats = this.aggregatedMetrics.routePerformance[metric.route]
    routeStats.count++
    routeStats.totalTime += metric.duration || 0

    if (metric.statusCode && metric.statusCode >= 400) {
      routeStats.errors++
    }

    // Update overall averages
    this.calculateAverages()
  }

  private calculateAverages(): void {
    const routes = Object.values(this.aggregatedMetrics.routePerformance)
    if (routes.length === 0) return

    const totalTime = routes.reduce((sum, route) => sum + route.totalTime, 0)
    const totalRequests = routes.reduce((sum, route) => sum + route.count, 0)
    const totalErrors = routes.reduce((sum, route) => sum + route.errors, 0)

    this.aggregatedMetrics.averageResponseTime = totalTime / totalRequests
    this.aggregatedMetrics.errorRate = (totalErrors / totalRequests) * 100
  }

  getMetrics(): typeof this.aggregatedMetrics {
    return { ...this.aggregatedMetrics }
  }

  getSlowestRoutes(limit: number = 5): Array<{ route: string; avgTime: number; count: number }> {
    return Object.entries(this.aggregatedMetrics.routePerformance)
      .map(([route, stats]) => ({
        route,
        avgTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit)
  }

  getMostErrorProneRoutes(limit: number = 5): Array<{ route: string; errorRate: number; errors: number }> {
    return Object.entries(this.aggregatedMetrics.routePerformance)
      .map(([route, stats]) => ({
        route,
        errorRate: (stats.errors / stats.count) * 100,
        errors: stats.errors
      }))
      .filter(item => item.errors > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit)
  }
}

// Global performance tracker instance
const performanceTracker = new PerformanceTracker()

// Performance monitoring middleware
export function performanceMiddleware(request: NextRequest): NextResponse {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const route = request.nextUrl.pathname
  const method = request.method
  const userAgent = request.headers.get('user-agent') || undefined
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const ip = xForwardedFor 
    ? xForwardedFor.split(',')[0].trim() 
    : request.ip ?? undefined

  // Start tracking
  performanceTracker.startTracking(requestId, route, method, userAgent, ip)

  // Create response with tracking headers
  const response = NextResponse.next()
  response.headers.set('X-Request-ID', requestId)

  // Add performance headers for client-side tracking
  response.headers.set('X-Performance-Start', Date.now().toString())

  return response
}

export interface PerformanceMiddlewareOptions {
  includeHeaders?: boolean
}

export function createPerformanceMiddleware(options: PerformanceMiddlewareOptions = {}) {
  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const requestId = request.headers.get('x-request-id') || Math.random().toString(36).substring(7)
    const userAgent = request.headers.get('user-agent')
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined

    // Start tracking
    performanceTracker.startTracking(
      requestId,
      request.nextUrl.pathname,
      request.method,
      userAgent || undefined,
      ip
    )

    // Create response with tracking headers
    const response = NextResponse.next()
    response.headers.set('X-Request-ID', requestId)

    // Add performance headers for client-side tracking
    response.headers.set('X-Performance-Start', Date.now().toString())

    // Add performance headers for server-side tracking
    if (options.includeHeaders) {
      response.headers.set('X-Performance-Start', Date.now().toString())
    }

    return response
  }
}

// Helper function to end tracking (to be called in API routes)
export function endPerformanceTracking(
  requestId: string, 
  statusCode: number, 
  contentLength?: number
): PerformanceMetrics | null {
  return performanceTracker.endTracking(requestId, statusCode, contentLength)
}

// Get performance analytics
export function getPerformanceAnalytics() {
  return {
    overview: performanceTracker.getMetrics(),
    slowestRoutes: performanceTracker.getSlowestRoutes(),
    errorProneRoutes: performanceTracker.getMostErrorProneRoutes()
  }
}

// Performance optimization utilities
export const optimizationUtils = {
  // Cache control headers
  setCacheHeaders: (response: NextResponse, maxAge: number = 3600): void => {
    response.headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`)
    response.headers.set('ETag', `"${Date.now()}"`)
  },

  // Compression headers
  enableCompression: (response: NextResponse): void => {
    response.headers.set('Content-Encoding', 'gzip')
    response.headers.set('Vary', 'Accept-Encoding')
  },

  // Security headers
  setSecurityHeaders: (response: NextResponse): void => {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  },

  // CORS headers
  setCORSHeaders: (response: NextResponse, origin?: string): void => {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  },

  // Performance monitoring headers
  setPerformanceHeaders: (response: NextResponse, metrics?: PerformanceMetrics): void => {
    if (metrics) {
      response.headers.set('X-Response-Time', `${metrics.duration}ms`)
      response.headers.set('X-Route', metrics.route)
    }
    response.headers.set('X-Powered-By', 'Be Better Web')
  }
}

// Request rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true
  }

  getRemainingRequests(identifier: string): number {
    const requests = this.requests.get(identifier) || []
    const now = Date.now()
    const validRequests = requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - validRequests.length)
  }

  getResetTime(identifier: string): number {
    const requests = this.requests.get(identifier) || []
    if (requests.length === 0) return 0
    
    const oldestRequest = Math.min(...requests)
    return oldestRequest + this.windowMs
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Rate limiting middleware
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const identifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  if (!rateLimiter.isAllowed(identifier)) {
    const response = new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )

    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', '0')
    response.headers.set('X-RateLimit-Reset', rateLimiter.getResetTime(identifier).toString())

    return response
  }

  return null // Allow request to proceed
}

// Response time monitoring
export function measureResponseTime<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now()
    
    try {
      const result = await operation()
      const duration = Date.now() - start
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operationName} took ${duration}ms`)
      }
      
      resolve({ result, duration })
    } catch (error) {
      const duration = Date.now() - start
      console.error(`Operation failed: ${operationName} after ${duration}ms`, error)
      reject(error)
    }
  })
}

// Memory usage monitoring
export function getMemoryUsage(): {
  rss: number
  heapTotal: number
  heapUsed: number
  external: number
  arrayBuffers: number
} {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100 // MB
    }
  }
  
  return {
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0
  }
}

// Export performance tracker for external access
export { performanceTracker }