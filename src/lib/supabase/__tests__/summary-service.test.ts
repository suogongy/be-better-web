import { summaryService } from '@/lib/supabase/database'
import { supabase } from '@/lib/supabase/client'
import { testDataGenerators } from '@/lib/testing/utils'

// Mock Supabase client
jest.mock('@/lib/supabase/client')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('summaryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSummary', () => {
    it('should fetch a summary successfully', async () => {
      const mockSummary = testDataGenerators.createSummary()
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSummary,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await summaryService.getSummary('user-id', '2023-01-01')

      expect(result).toEqual(mockSummary)
      expect(mockSupabase.from).toHaveBeenCalledWith('daily_summaries')
    })

    it('should return null when summary not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // No rows returned
              }),
            }),
          }),
        }),
      } as any)

      const result = await summaryService.getSummary('user-id', '2023-01-01')

      expect(result).toBeNull()
    })

    it('should throw DatabaseError on API error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      } as any)

      await expect(summaryService.getSummary('user-id', '2023-01-01'))
        .rejects
        .toThrow('Failed to fetch summary')
    })
  })

  describe('createSummary', () => {
    it('should create a summary successfully', async () => {
      const summaryData = {
        user_id: 'user-id',
        summary_date: '2023-01-01',
        total_tasks: 5,
        completed_tasks: 3,
        completion_rate: 60,
        productivity_score: 75,
      }

      const mockCreatedSummary = testDataGenerators.createSummary(summaryData)

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedSummary,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await summaryService.createSummary(summaryData)

      expect(result).toEqual(mockCreatedSummary)
      expect(mockSupabase.from).toHaveBeenCalledWith('daily_summaries')
    })

    it('should throw DatabaseError on creation failure', async () => {
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

      await expect(summaryService.createSummary({
        user_id: 'user-id',
        summary_date: '2023-01-01',
      }))
        .rejects
        .toThrow('Failed to create summary')
    })
  })

  describe('updateSummary', () => {
    it('should update a summary successfully', async () => {
      const updates = {
        notes: 'Updated notes',
        mood_rating: 4,
      }

      const mockUpdatedSummary = testDataGenerators.createSummary(updates)

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedSummary,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any)

      const result = await summaryService.updateSummary('user-id', '2023-01-01', updates)

      expect(result).toEqual(mockUpdatedSummary)
      expect(mockSupabase.from).toHaveBeenCalledWith('daily_summaries')
    })

    it('should throw DatabaseError on update failure', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Update failed' },
                }),
              }),
            }),
          }),
        }),
      } as any)

      await expect(summaryService.updateSummary('user-id', '2023-01-01', { notes: 'test' }))
        .rejects
        .toThrow('Failed to update summary')
    })
  })

  describe('getSummaries', () => {
    it('should fetch summaries with default options', async () => {
      const mockSummaries = [
        testDataGenerators.createSummary({ summary_date: '2023-01-01' }),
        testDataGenerators.createSummary({ summary_date: '2023-01-02' }),
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockSummaries,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await summaryService.getSummaries('user-id')

      expect(result).toEqual(mockSummaries)
      expect(mockSupabase.from).toHaveBeenCalledWith('daily_summaries')
    })

    it('should apply date range filters', async () => {
      const mockSummaries = [testDataGenerators.createSummary()]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockSummaries,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await summaryService.getSummaries('user-id', {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        limit: 10,
      })

      expect(mockQuery.gte).toHaveBeenCalledWith('summary_date', '2023-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('summary_date', '2023-01-31')
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
    })
  })

  describe('generateDailySummary', () => {
    it('should generate a summary from tasks', async () => {
      // Mock the tasks query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'tasks') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [
                    testDataGenerators.createTask({
                      status: 'completed',
                      estimated_minutes: 60,
                      actual_minutes: 50,
                    }),
                    testDataGenerators.createTask({
                      status: 'pending',
                      estimated_minutes: 30,
                    }),
                  ],
                  error: null,
                }),
              }),
            }),
          }
        }
        
        // Mock summary operations
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: testDataGenerators.createSummary({
                  total_tasks: 2,
                  completed_tasks: 1,
                  completion_rate: 50,
                  total_planned_time: 90,
                  total_actual_time: 50,
                  productivity_score: 75,
                }),
                error: null,
              }),
            }),
          }),
        }
      } as any)

      const result = await summaryService.generateDailySummary('user-id', '2023-01-01')

      expect(result).toBeDefined()
      expect(result.total_tasks).toBe(2)
      expect(result.completed_tasks).toBe(1)
      expect(result.completion_rate).toBe(50)
    })
  })

  describe('getProductivityTrends', () => {
    it('should calculate productivity trends correctly', async () => {
      const mockSummaries = Array.from({ length: 30 }, (_, i) => 
        testDataGenerators.createSummary({
          summary_date: new Date(2023, 0, i + 1).toISOString().split('T')[0],
          productivity_score: 70 + (i % 20), // Varying scores
          completion_rate: 60 + (i % 30),
          total_tasks: 5,
        })
      )

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

      const result = await summaryService.getProductivityTrends('user-id', 30)

      expect(result).toBeDefined()
      expect(result.daily).toHaveLength(30)
      expect(result.averages).toBeDefined()
      expect(result.averages.avg_productivity_score).toBeGreaterThan(0)
      expect(result.averages.avg_completion_rate).toBeGreaterThan(0)
    })
  })

  describe('getWeeklyInsights', () => {
    it('should generate weekly insights', async () => {
      const mockSummaries = Array.from({ length: 7 }, (_, i) => 
        testDataGenerators.createSummary({
          summary_date: new Date(2023, 0, i + 1).toISOString().split('T')[0],
          productivity_score: 70 + i * 5,
          total_tasks: 5,
          completed_tasks: 3 + i,
        })
      )

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: mockSummaries,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await summaryService.getWeeklyInsights('user-id', 0)

      expect(result).toBeDefined()
      expect(result.daily_breakdown).toHaveLength(7)
      expect(result.total_tasks).toBeGreaterThan(0)
      expect(result.completed_tasks).toBeGreaterThan(0)
      expect(result.best_day).toBeDefined()
      expect(result.worst_day).toBeDefined()
    })
  })

  describe('Blog Generation', () => {
    describe('generateBlogPost', () => {
      it('should generate a daily blog post', async () => {
        const mockSummary = testDataGenerators.createSummary({
          summary_date: '2023-01-01',
          total_tasks: 5,
          completed_tasks: 4,
          productivity_score: 85,
          achievements: ['Completed important project'],
          challenges: ['Time management'],
        })

        // Mock getting the summary
        mockSupabase.from.mockImplementation((table) => {
          if (table === 'daily_summaries') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockSummary,
                    error: null,
                  }),
                }),
              }),
            }
          }
          // Mock tasks
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }
        } as any)

        const result = await summaryService.generateBlogPost('user-id', 'summary-id', 'daily')

        expect(result).toBeDefined()
        expect(result.title).toContain('Daily Productivity Summary')
        expect(result.content).toContain('completed 4 out of 5 tasks')
        expect(result.excerpt).toBeDefined()
        expect(result.tags).toContain('daily-summary')
      })

      it('should throw error when summary not found', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        } as any)

        await expect(summaryService.generateBlogPost('user-id', 'non-existent-id'))
          .rejects
          .toThrow('Summary not found')
      })
    })

    describe('createBlogPostFromSummary', () => {
      it('should create a blog post from summary successfully', async () => {
        const mockSummary = testDataGenerators.createSummary()
        const mockPost = testDataGenerators.createPost()

        // Mock summary retrieval and blog generation
        mockSupabase.from.mockImplementation((table) => {
          if (table === 'daily_summaries') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockSummary,
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }
          }
          if (table === 'posts') {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPost,
                    error: null,
                  }),
                }),
              }),
            }
          }
          // Tasks
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }
        } as any)

        const result = await summaryService.createBlogPostFromSummary('user-id', 'summary-id', 'daily')

        expect(result).toEqual(mockPost)
      })
    })
  })
})