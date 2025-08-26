import { insightsService } from '@/lib/supabase/advanced-services'
import { supabase } from '@/lib/supabase/client'
import { testDataGenerators } from '@/lib/testing/utils'

// Mock Supabase client
jest.mock('@/lib/supabase/client')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('insightsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateInsight', () => {
    it('should generate productivity insight successfully', async () => {
      const insightData = {
        user_id: 'user-id',
        insight_type: 'productivity_correlation' as const,
        title: 'Mood vs Productivity Analysis',
        description: 'Analysis of how mood affects productivity',
        data: {
          correlation: 0.75,
          confidence: 0.85,
          sample_size: 30,
        },
        recommendations: [
          'Focus on mood improvement strategies',
          'Track mood patterns for better productivity',
        ],
        date_range: {
          start: '2023-01-01',
          end: '2023-01-31',
        },
      }

      const mockInsight = {
        id: 'insight-' + Math.random().toString(36).substr(2, 9),
        ...insightData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockInsight,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await insightsService.generateInsight(insightData)

      expect(result).toEqual(mockInsight)
      expect(mockSupabase.from).toHaveBeenCalledWith('productivity_insights')
    })

    it('should throw error on generation failure', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      } as any)

      await expect(insightsService.generateInsight({
        user_id: 'user-id',
        insight_type: 'productivity_correlation',
        title: 'Test Insight',
        description: 'Test description',
        data: {},
      }))
        .rejects
        .toThrow('Failed to generate insight')
    })
  })

  describe('getInsights', () => {
    it('should fetch user insights successfully', async () => {
      const mockInsights = [
        {
          id: 'insight-1',
          user_id: 'user-id',
          insight_type: 'productivity_correlation' as const,
          title: 'Mood Impact Analysis',
          created_at: '2023-01-01T00:00:00.000Z',
        },
        {
          id: 'insight-2',
          user_id: 'user-id',
          insight_type: 'habit_productivity' as const,
          title: 'Exercise Productivity Boost',
          created_at: '2023-01-02T00:00:00.000Z',
        },
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockInsights,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await insightsService.getInsights('user-id')

      expect(result).toEqual(mockInsights)
      expect(mockSupabase.from).toHaveBeenCalledWith('productivity_insights')
    })

    it('should apply type filter when provided', async () => {
      const mockInsights = [
        {
          id: 'insight-1',
          insight_type: 'productivity_correlation' as const,
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockInsights,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await insightsService.getInsights('user-id', { 
        type: 'productivity_correlation',
        limit: 5 
      })

      // Should filter by user_id and type
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-id')
      expect(mockQuery.eq).toHaveBeenCalledWith('insight_type', 'productivity_correlation')
      expect(mockQuery.limit).toHaveBeenCalledWith(5)
    })
  })

  describe('deleteInsight', () => {
    it('should delete insight successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      await insightsService.deleteInsight('insight-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('productivity_insights')
    })

    it('should throw error on deletion failure', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      } as any)

      await expect(insightsService.deleteInsight('insight-id'))
        .rejects
        .toThrow('Failed to delete insight')
    })
  })

  describe('analyzeProductivityCorrelations', () => {
    it('should analyze mood vs productivity correlation', async () => {
      const mockSummaries = [
        { productivity_score: 85, mood_rating: 8 },
        { productivity_score: 70, mood_rating: 6 },
        { productivity_score: 90, mood_rating: 9 },
        { productivity_score: 60, mood_rating: 5 },
        { productivity_score: 80, mood_rating: 7 },
      ]

      const mockMoodLogs = [
        { log_date: '2023-01-01', mood_rating: 8 },
        { log_date: '2023-01-02', mood_rating: 6 },
        { log_date: '2023-01-03', mood_rating: 9 },
        { log_date: '2023-01-04', mood_rating: 5 },
        { log_date: '2023-01-05', mood_rating: 7 },
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'daily_summaries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: mockSummaries,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'mood_logs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: mockMoodLogs,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }
      } as any)

      const result = await insightsService.analyzeProductivityCorrelations('user-id', 30)

      expect(result.mood_productivity).toBeDefined()
      expect(result.mood_productivity.correlation).toBeGreaterThan(0) // Positive correlation expected
      expect(result.mood_productivity.confidence_level).toBeGreaterThan(0)
      expect(result.mood_productivity.sample_size).toBe(5)
    })

    it('should analyze habit vs productivity correlation', async () => {
      const mockSummaries = [
        { summary_date: '2023-01-01', productivity_score: 85 },
        { summary_date: '2023-01-02', productivity_score: 70 },
        { summary_date: '2023-01-03', productivity_score: 90 },
      ]

      const mockHabitLogs = [
        { log_date: '2023-01-01', habit_id: 'exercise', completed_count: 1 },
        { log_date: '2023-01-02', habit_id: 'exercise', completed_count: 0 },
        { log_date: '2023-01-03', habit_id: 'exercise', completed_count: 1 },
      ]

      const mockHabits = [
        { id: 'exercise', name: 'Exercise', category: 'health' },
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'daily_summaries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: mockSummaries,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'habit_logs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: mockHabitLogs,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'habits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockHabits,
                error: null,
              }),
            }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }
      } as any)

      const result = await insightsService.analyzeProductivityCorrelations('user-id', 30)

      expect(result.habit_productivity).toBeDefined()
      expect(result.habit_productivity.Exercise).toBeDefined()
      expect(result.habit_productivity.Exercise.correlation).toBeDefined()
    })
  })

  describe('analyzeTimePatterns', () => {
    it('should analyze productivity patterns by time', async () => {
      const mockTasks = Array.from({ length: 10 }, (_, i) => ({
        created_at: new Date(2023, 0, 1, 9 + (i % 8)).toISOString(), // 9 AM to 5 PM
        completed_at: new Date(2023, 0, 1, 10 + (i % 8)).toISOString(),
        status: 'completed',
        estimated_minutes: 60,
        actual_minutes: 50 + (i % 20),
      }))

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: mockTasks,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await insightsService.analyzeTimePatterns('user-id', 30)

      expect(result.hourly_productivity).toBeDefined()
      expect(result.peak_hours).toBeDefined()
      expect(result.low_hours).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations)).toBe(true)
    })
  })

  describe('analyzeWorkloadBalance', () => {
    it('should analyze workload distribution and balance', async () => {
      const mockTasks = [
        { category: 'Work', estimated_minutes: 480, status: 'completed' },
        { category: 'Work', estimated_minutes: 240, status: 'pending' },
        { category: 'Personal', estimated_minutes: 120, status: 'completed' },
        { category: 'Learning', estimated_minutes: 60, status: 'completed' },
      ]

      const mockSummaries = [
        { summary_date: '2023-01-01', productivity_score: 85, total_tasks: 5, completed_tasks: 4 },
        { summary_date: '2023-01-02', productivity_score: 70, total_tasks: 8, completed_tasks: 5 },
        { summary_date: '2023-01-03', productivity_score: 90, total_tasks: 3, completed_tasks: 3 },
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'tasks') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockResolvedValue({
                    data: mockTasks,
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'daily_summaries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: mockSummaries,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }
      } as any)

      const result = await insightsService.analyzeWorkloadBalance('user-id', 30)

      expect(result.category_distribution).toBeDefined()
      expect(result.workload_score).toBeDefined()
      expect(result.balance_recommendations).toBeDefined()
      expect(result.category_distribution.Work).toBeDefined()
      expect(result.category_distribution.Personal).toBeDefined()
    })
  })

  describe('generateWeeklyInsights', () => {
    it('should generate comprehensive weekly insights', async () => {
      // Mock all data sources
      const mockSummaries = Array.from({ length: 7 }, (_, i) => ({
        summary_date: new Date(2023, 0, i + 1).toISOString().split('T')[0],
        productivity_score: 70 + (i * 5),
        completion_rate: 60 + (i * 10),
        total_tasks: 5,
        completed_tasks: 3 + i,
        mood_rating: 6 + i,
      }))

      const mockTasks = Array.from({ length: 20 }, (_, i) => ({
        created_at: new Date(2023, 0, 1 + (i % 7)).toISOString(),
        status: i % 3 === 0 ? 'completed' : 'pending',
        category: i % 2 === 0 ? 'Work' : 'Personal',
        priority: ['low', 'medium', 'high'][i % 3],
      }))

      const mockHabitLogs = Array.from({ length: 14 }, (_, i) => ({
        log_date: new Date(2023, 0, 1 + (i % 7)).toISOString().split('T')[0],
        habit_id: 'exercise',
        completed_count: i % 2,
        target_count: 1,
      }))

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'daily_summaries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: mockSummaries,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'tasks') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockResolvedValue({
                    data: mockTasks,
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'habit_logs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: mockHabitLogs,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }
      } as any)

      const result = await insightsService.generateWeeklyInsights('user-id')

      expect(result.summary).toBeDefined()
      expect(result.trends).toBeDefined()
      expect(result.achievements).toBeDefined()
      expect(result.areas_for_improvement).toBeDefined()
      expect(result.recommendations).toBeDefined()
      
      expect(result.summary.avg_productivity_score).toBeGreaterThan(0)
      expect(result.summary.total_tasks_completed).toBeGreaterThan(0)
      expect(Array.isArray(result.recommendations)).toBe(true)
    })
  })

  describe('predictProductivityTrends', () => {
    it('should predict future productivity trends', async () => {
      const mockSummaries = Array.from({ length: 30 }, (_, i) => ({
        summary_date: new Date(2023, 0, i + 1).toISOString().split('T')[0],
        productivity_score: 70 + Math.sin(i / 7) * 10, // Weekly pattern
        completion_rate: 60 + Math.sin(i / 7) * 15,
        total_tasks: 5,
        completed_tasks: 3,
      }))

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockSummaries,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await insightsService.predictProductivityTrends('user-id', 7)

      expect(result.predictions).toBeDefined()
      expect(result.confidence_score).toBeDefined()
      expect(result.trend_direction).toBeDefined()
      expect(result.seasonal_patterns).toBeDefined()
      expect(['up', 'down', 'stable']).toContain(result.trend_direction)
      expect(result.confidence_score).toBeGreaterThanOrEqual(0)
      expect(result.confidence_score).toBeLessThanOrEqual(1)
    })
  })
})