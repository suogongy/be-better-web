/**
 * Performance monitoring and analytics utilities
 * Provides comprehensive performance tracking and optimization tools
 */

// Performance metrics interface
export interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming | null
  paint: PerformancePaintTiming[]
  resources: PerformanceResourceTiming[]
  vitals: WebVitals
  customMetrics: CustomMetrics
}

export interface WebVitals {
  FCP?: number // First Contentful Paint
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
}

export interface CustomMetrics {
  componentRender: Record<string, number>
  apiCalls: Record<string, number>
  cacheHits: number
  cacheMisses: number
  errorCount: number
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics
  private observers: PerformanceObserver[]
  private isEnabled: boolean

  constructor() {
    this.metrics = {
      navigation: null,
      paint: [],
      resources: [],
      vitals: {},
      customMetrics: {
        componentRender: {},
        apiCalls: {},
        cacheHits: 0,
        cacheMisses: 0,
        errorCount: 0
      }
    }
    this.observers = []
    this.isEnabled = typeof window !== 'undefined' && 'performance' in window
    
    if (this.isEnabled) {
      this.initializeObservers()
      this.captureNavigationTiming()
    }
  }

  private initializeObservers(): void {
    // Paint timing observer
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformancePaintTiming[]
          this.metrics.paint.push(...entries)
          
          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.vitals.FCP = entry.startTime
            }
          })
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(paintObserver)
      } catch (e) {
        console.warn('Paint observer not supported:', e)
      }

      // Largest Contentful Paint observer
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry
          this.metrics.vitals.LCP = lastEntry.startTime
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported:', e)
      }

      // Layout shift observer
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.metrics.vitals.CLS = (this.metrics.vitals.CLS || 0) + clsValue
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported:', e)
      }

      // Resource timing observer
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceResourceTiming[]
          this.metrics.resources.push(...entries)
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (e) {
        console.warn('Resource observer not supported:', e)
      }
    }
  }

  private captureNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navEntries.length > 0) {
        this.metrics.navigation = navEntries[0]
        this.metrics.vitals.TTFB = navEntries[0].responseStart - navEntries[0].requestStart
      }
    }
  }

  public recordComponentRender(componentName: string, duration: number): void {
    this.metrics.customMetrics.componentRender[componentName] = 
      (this.metrics.customMetrics.componentRender[componentName] || 0) + duration
  }

  public recordApiCall(endpoint: string, duration: number): void {
    this.metrics.customMetrics.apiCalls[endpoint] = 
      (this.metrics.customMetrics.apiCalls[endpoint] || 0) + duration
  }

  public recordCacheHit(): void {
    this.metrics.customMetrics.cacheHits++
  }

  public recordCacheMiss(): void {
    this.metrics.customMetrics.cacheMisses++
  }

  public recordError(): void {
    this.metrics.customMetrics.errorCount++
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public getCoreWebVitals(): WebVitals {
    return { ...this.metrics.vitals }
  }

  public getPerformanceScore(): number {
    const vitals = this.metrics.vitals
    let score = 100

    // Deduct points based on Core Web Vitals thresholds
    if (vitals.FCP && vitals.FCP > 1800) score -= 10
    if (vitals.LCP && vitals.LCP > 2500) score -= 15
    if (vitals.FID && vitals.FID > 100) score -= 10
    if (vitals.CLS && vitals.CLS > 0.1) score -= 15
    if (vitals.TTFB && vitals.TTFB > 600) score -= 10

    // Deduct points for errors
    score -= Math.min(this.metrics.customMetrics.errorCount * 5, 30)

    return Math.max(score, 0)
  }

  public generateReport(): string {
    const vitals = this.metrics.vitals
    const custom = this.metrics.customMetrics
    
    return `
Performance Report:
==================
Core Web Vitals:
- First Contentful Paint: ${vitals.FCP?.toFixed(2) || 'N/A'} ms
- Largest Contentful Paint: ${vitals.LCP?.toFixed(2) || 'N/A'} ms
- First Input Delay: ${vitals.FID?.toFixed(2) || 'N/A'} ms
- Cumulative Layout Shift: ${vitals.CLS?.toFixed(3) || 'N/A'}
- Time to First Byte: ${vitals.TTFB?.toFixed(2) || 'N/A'} ms

Custom Metrics:
- Cache Hit Rate: ${((custom.cacheHits / (custom.cacheHits + custom.cacheMisses)) * 100).toFixed(1)}%
- Total Errors: ${custom.errorCount}
- Performance Score: ${this.getPerformanceScore()}/100

Resource Count: ${this.metrics.resources.length}
    `.trim()
  }

  public exportData(): any {
    return {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      metrics: this.getMetrics(),
      score: this.getPerformanceScore()
    }
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Performance hooks for React components
export function usePerformanceMonitor() {
  const monitor = new PerformanceMonitor()
  
  const measureComponentRender = (componentName: string) => {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      monitor.recordComponentRender(componentName, duration)
    }
  }

  const measureApiCall = async <T>(
    endpoint: string, 
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now()
    try {
      const result = await apiCall()
      const duration = performance.now() - start
      monitor.recordApiCall(endpoint, duration)
      return result
    } catch (error) {
      monitor.recordError()
      throw error
    }
  }

  return {
    monitor,
    measureComponentRender,
    measureApiCall,
    getMetrics: () => monitor.getMetrics(),
    getScore: () => monitor.getPerformanceScore()
  }
}

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  },

  // Throttle function calls
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // Lazy load images
  lazyLoadImage: (img: HTMLImageElement, src: string): void => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              img.src = src
              observer.unobserve(img)
            }
          })
        },
        { threshold: 0.1 }
      )
      observer.observe(img)
    } else {
      img.src = src
    }
  },

  // Preload critical resources
  preloadResource: (href: string, as: string): void => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      document.head.appendChild(link)
    }
  },

  // Bundle size analyzer
  analyzeBundleSize: (): void => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const jsResources = resources.filter(r => r.name.includes('.js'))
      const cssResources = resources.filter(r => r.name.includes('.css'))

      console.group('Bundle Analysis')
      console.log('JavaScript files:', jsResources.length)
      console.log('Total JS size (estimated):', 
        jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024, 'KB')
      console.log('CSS files:', cssResources.length)
      console.log('Total CSS size (estimated):', 
        cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024, 'KB')
      console.groupEnd()
    }
  },

  // Memory usage monitoring
  getMemoryUsage: (): any => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (performance as any)) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize / 1024 / 1024, // MB
        totalJSHeapSize: memory.totalJSHeapSize / 1024 / 1024, // MB
        jsHeapSizeLimit: memory.jsHeapSizeLimit / 1024 / 1024 // MB
      }
    }
    return null
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor()

// Initialize performance monitoring on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Log initial performance metrics
    setTimeout(() => {
      console.log(globalPerformanceMonitor.generateReport())
    }, 2000)
  })

  // Export performance data on page unload
  window.addEventListener('beforeunload', () => {
    const data = globalPerformanceMonitor.exportData()
    // Send to analytics endpoint (would be implemented in production)
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon('/api/analytics/performance', JSON.stringify(data))
    }
  })
}