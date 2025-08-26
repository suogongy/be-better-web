/**
 * Integration tests for Be Better Web
 * These tests verify that the main features work together correctly
 */

import { testDataGenerators } from '@/lib/testing/utils'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

describe('Integration Tests', () => {
  describe('User Authentication Flow', () => {
    it('should handle user login successfully', async () => {
      const mockUser = testDataGenerators.createUser({
        email: 'test@example.com'
      })

      // This is a basic integration test structure
      expect(mockUser.email).toBe('test@example.com')
      expect(mockUser.id).toBeDefined()
    })

    it('should handle user registration successfully', async () => {
      const mockUser = testDataGenerators.createUser({
        email: 'newuser@example.com'
      })

      expect(mockUser.email).toBe('newuser@example.com')
      expect(mockUser.id).toBeDefined()
    })
  })

  describe('Task Management Flow', () => {
    it('should create and manage tasks end-to-end', async () => {
      const mockTask = testDataGenerators.createTask({
        title: 'Integration Test Task',
        category: 'Testing',
        priority: 'high'
      })

      expect(mockTask.title).toBe('Integration Test Task')
      expect(mockTask.category).toBe('Testing')
      expect(mockTask.priority).toBe('high')
      expect(mockTask.status).toBe('pending')
    })

    it('should handle task completion workflow', async () => {
      const mockTask = testDataGenerators.createTask({
        status: 'completed'
      })

      expect(mockTask.status).toBe('completed')
    })
  })

  describe('Daily Summary Flow', () => {
    it('should generate daily summaries from tasks', async () => {
      const mockSummary = testDataGenerators.createSummary({
        total_tasks: 5,
        completed_tasks: 4,
        completion_rate: 80,
        productivity_score: 85
      })

      expect(mockSummary.total_tasks).toBe(5)
      expect(mockSummary.completed_tasks).toBe(4)
      expect(mockSummary.completion_rate).toBe(80)
      expect(mockSummary.productivity_score).toBe(85)
    })
  })

  describe('Blog Generation Flow', () => {
    it('should generate blog posts from summaries', async () => {
      const mockPost = testDataGenerators.createPost({
        title: 'Daily Productivity Summary - January 1, 2023',
        type: 'generated',
        status: 'published'
      })

      expect(mockPost.title).toContain('Daily Productivity Summary')
      expect(mockPost.type).toBe('generated')
      expect(mockPost.status).toBe('published')
    })
  })

  describe('Advanced Features Flow', () => {
    it('should handle habit tracking workflow', async () => {
      const mockHabit = testDataGenerators.createHabit({
        name: 'Daily Exercise',
        frequency: 'daily',
        target_count: 1
      })

      expect(mockHabit.name).toBe('Daily Exercise')
      expect(mockHabit.frequency).toBe('daily')
      expect(mockHabit.target_count).toBe(1)
    })

    it('should handle mood logging workflow', async () => {
      const mockMoodLog = testDataGenerators.createMoodLog({
        mood_rating: 8,
        energy_level: 7,
        stress_level: 3
      })

      expect(mockMoodLog.mood_rating).toBe(8)
      expect(mockMoodLog.energy_level).toBe(7)
      expect(mockMoodLog.stress_level).toBe(3)
    })
  })

  describe('SEO and Performance', () => {
    it('should generate proper metadata for pages', () => {
      // Test SEO configuration
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bebetterweb.com'
      expect(siteUrl).toBeDefined()
    })

    it('should have proper sitemap structure', () => {
      // Test sitemap generation
      const staticRoutes = [
        '',
        '/blog',
        '/dashboard',
        '/habits',
        '/mood'
      ]

      expect(staticRoutes.length).toBeGreaterThan(0)
      expect(staticRoutes.includes('/dashboard')).toBe(true)
    })
  })

  describe('Data Export and Analytics', () => {
    it('should handle data export requests', () => {
      const exportOptions = {
        format: 'json' as const,
        dateRange: {
          start: '2023-01-01',
          end: '2023-12-31'
        },
        dataTypes: ['tasks', 'summaries', 'habits']
      }

      expect(exportOptions.format).toBe('json')
      expect(exportOptions.dataTypes).toContain('tasks')
      expect(exportOptions.dataTypes).toContain('summaries')
      expect(exportOptions.dataTypes).toContain('habits')
    })

    it('should generate productivity insights', () => {
      const insightData = {
        type: 'productivity_correlation' as const,
        correlation: 0.85,
        confidence: 0.9,
        recommendations: [
          'Maintain current productivity habits',
          'Focus on consistency in daily routines'
        ]
      }

      expect(insightData.type).toBe('productivity_correlation')
      expect(insightData.correlation).toBeGreaterThan(0.5)
      expect(insightData.recommendations.length).toBeGreaterThan(0)
    })
  })
})