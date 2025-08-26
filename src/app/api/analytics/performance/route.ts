import { NextRequest, NextResponse } from 'next/server'
import { getPerformanceAnalytics, getMemoryUsage } from '@/lib/performance/middleware'
import { globalPerformanceMonitor } from '@/lib/performance/monitoring'

export async function GET(request: NextRequest) {
  try {
    // Get server-side performance analytics
    const serverAnalytics = getPerformanceAnalytics()
    
    // Get memory usage
    const memoryUsage = getMemoryUsage()
    
    // Get client-side performance metrics (if available)
    const clientMetrics = globalPerformanceMonitor.getMetrics()
    
    // Combine all analytics
    const analytics = {
      timestamp: new Date().toISOString(),
      server: {
        ...serverAnalytics,
        memory: memoryUsage,
        uptime: process.uptime ? Math.round(process.uptime()) : 0
      },
      client: {
        vitals: clientMetrics.vitals,
        customMetrics: clientMetrics.customMetrics,
        score: globalPerformanceMonitor.getPerformanceScore()
      },
      summary: {
        totalRequests: serverAnalytics.overview.totalRequests,
        averageResponseTime: Math.round(serverAnalytics.overview.averageResponseTime * 100) / 100,
        errorRate: Math.round(serverAnalytics.overview.errorRate * 100) / 100,
        memoryUsagePercent: memoryUsage.heapUsed > 0 ? 
          Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100) : 0,
        performanceScore: globalPerformanceMonitor.getPerformanceScore()
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching performance analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance analytics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Accept client-side performance data
    const data = await request.json()
    
    // Log client performance data
    console.log('Client Performance Data:', {
      timestamp: new Date().toISOString(),
      url: data.url,
      metrics: data.metrics,
      score: data.score
    })

    // In production, you would store this in a database or analytics service
    // For now, we'll just acknowledge receipt
    return NextResponse.json({ 
      status: 'success',
      message: 'Performance data received' 
    })
  } catch (error) {
    console.error('Error processing performance data:', error)
    return NextResponse.json(
      { error: 'Failed to process performance data' },
      { status: 500 }
    )
  }
}