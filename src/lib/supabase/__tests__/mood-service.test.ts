import { moodService } from '@/lib/supabase/advanced-services'
import { supabase } from '@/lib/supabase/client'
import { testDataGenerators } from '@/lib/testing/utils'

// Mock Supabase client
jest.mock('@/lib/supabase/client')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('moodService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logMood', () => {
    it('should log mood successfully', async () => {
      const moodData = {
        user_id: 'user-id',
        log_date: '2023-01-01',
        mood_rating: 8,
        energy_level: 7,
        stress_level: 3,
        sleep_quality: 9,
        notes: 'Great day today!',
        tags: ['work', 'exercise'],
        weather: 'sunny',
        location: 'home',
      }

      const mockMoodLog = testDataGenerators.createMoodLog(moodData)

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMoodLog,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await moodService.logMood(moodData)

      expect(result).toEqual(mockMoodLog)
      expect(mockSupabase.from).toHaveBeenCalledWith('mood_logs')
    })

    it('should throw error on logging failure', async () => {
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

      await expect(moodService.logMood({
        user_id: 'user-id',
        log_date: '2023-01-01',
        mood_rating: 5,
      }))
        .rejects
        .toThrow('Failed to log mood')
    })
  })

  describe('getMoodLogs', () => {
    it('should fetch mood logs with default options', async () => {
      const mockLogs = [
        testDataGenerators.createMoodLog({ mood_rating: 8, log_date: '2023-01-01' }),
        testDataGenerators.createMoodLog({ mood_rating: 6, log_date: '2023-01-02' }),
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockLogs,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await moodService.getMoodLogs('user-id')

      expect(result).toEqual(mockLogs)
      expect(mockSupabase.from).toHaveBeenCalledWith('mood_logs')
    })

    it('should apply date range filters', async () => {
      const mockLogs = [testDataGenerators.createMoodLog()]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await moodService.getMoodLogs('user-id', {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        limit: 10,
      })

      expect(mockQuery.gte).toHaveBeenCalledWith('log_date', '2023-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('log_date', '2023-01-31')
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
    })

    it('should throw error on fetch failure', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Fetch failed' },
              }),
            }),
          }),
        }),
      } as any)

      await expect(moodService.getMoodLogs('user-id'))
        .rejects
        .toThrow('Failed to fetch mood logs')
    })
  })

  describe('updateMoodLog', () => {
    it('should update mood log successfully', async () => {
      const updates = {
        mood_rating: 9,
        notes: 'Updated notes',
        tags: ['updated', 'mood'],
      }

      const mockUpdatedLog = testDataGenerators.createMoodLog(updates)

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedLog,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await moodService.updateMoodLog('log-id', updates)

      expect(result).toEqual(mockUpdatedLog)
      expect(mockSupabase.from).toHaveBeenCalledWith('mood_logs')
    })
  })

  describe('deleteMoodLog', () => {
    it('should delete mood log successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      await moodService.deleteMoodLog('log-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('mood_logs')
    })

    it('should throw error on deletion failure', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      } as any)

      await expect(moodService.deleteMoodLog('log-id'))
        .rejects
        .toThrow('Failed to delete mood log')
    })
  })

  describe('getMoodStats', () => {
    it('should calculate mood statistics correctly', async () => {
      const mockLogs = [
        { mood_rating: 8, energy_level: 7, stress_level: 3, sleep_quality: 9 },
        { mood_rating: 6, energy_level: 5, stress_level: 6, sleep_quality: 7 },
        { mood_rating: 9, energy_level: 8, stress_level: 2, sleep_quality: 8 },
      ]

      // Mock mood logs query
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockLogs,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await moodService.getMoodStats('user-id', 30)

      expect(result.total_entries).toBe(3)
      expect(result.avg_mood).toBeCloseTo(7.67, 1)
      expect(result.avg_energy).toBeCloseTo(6.67, 1)
      expect(result.avg_stress).toBeCloseTo(3.67, 1)
      expect(result.avg_sleep).toBeCloseTo(8, 1)
      expect(['up', 'down', 'stable']).toContain(result.mood_trend)
    })

    it('should return empty stats when no logs exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await moodService.getMoodStats('user-id', 30)

      expect(result.total_entries).toBe(0)
      expect(result.avg_mood).toBe(0)
      expect(result.mood_trend).toBe('stable')
    })
  })

  describe('getMoodTrends', () => {
    it('should calculate mood trends over time', async () => {
      const mockLogs = Array.from({ length: 7 }, (_, i) => ({
        log_date: new Date(2023, 0, i + 1).toISOString().split('T')[0],
        mood_rating: 5 + i, // Increasing trend
        energy_level: 6,
        stress_level: 4,
        sleep_quality: 7,
        created_at: new Date(2023, 0, i + 1).toISOString(),
      }))

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockLogs,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await moodService.getMoodTrends('user-id', 7)

      expect(result.daily).toHaveLength(7)
      expect(result.averages).toBeDefined()
      expect(result.averages.avg_mood).toBeGreaterThan(0)
      expect(result.trend_direction).toBe('up')
    })
  })

  describe('getMoodCorrelations', () => {
    it('should calculate correlations between mood factors', async () => {
      const mockLogs = [
        { mood_rating: 8, energy_level: 8, stress_level: 2, sleep_quality: 9 },
        { mood_rating: 6, energy_level: 6, stress_level: 5, sleep_quality: 6 },
        { mood_rating: 4, energy_level: 4, stress_level: 8, sleep_quality: 4 },
        { mood_rating: 9, energy_level: 9, stress_level: 1, sleep_quality: 9 },
        { mood_rating: 5, energy_level: 5, stress_level: 6, sleep_quality: 5 },
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockLogs,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await moodService.getMoodCorrelations('user-id', 30)

      expect(result).toBeDefined()
      expect(result.mood_energy_correlation).toBeGreaterThan(0) // Should be positive
      expect(result.mood_stress_correlation).toBeLessThan(0) // Should be negative
      expect(result.mood_sleep_correlation).toBeGreaterThan(0) // Should be positive
    })
  })

  describe('getWeeklyMoodPattern', () => {
    it('should analyze weekly mood patterns', async () => {
      const mockLogs = [
        { log_date: '2023-01-01', mood_rating: 7 }, // Sunday
        { log_date: '2023-01-02', mood_rating: 6 }, // Monday
        { log_date: '2023-01-03', mood_rating: 8 }, // Tuesday
        { log_date: '2023-01-04', mood_rating: 7 }, // Wednesday
        { log_date: '2023-01-05', mood_rating: 9 }, // Thursday
        { log_date: '2023-01-06', mood_rating: 8 }, // Friday
        { log_date: '2023-01-07', mood_rating: 9 }, // Saturday
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockLogs,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await moodService.getWeeklyMoodPattern('user-id', 4)

      expect(result.days_of_week).toHaveLength(7)
      expect(result.best_day).toBeDefined()
      expect(result.worst_day).toBeDefined()
      expect(result.weekend_vs_weekday).toBeDefined()
    })
  })

  describe('getMoodByTag', () => {
    it('should analyze mood by tags', async () => {
      const mockLogs = [
        { mood_rating: 8, tags: ['work', 'exercise'] },
        { mood_rating: 6, tags: ['work', 'stress'] },
        { mood_rating: 9, tags: ['vacation', 'family'] },
        { mood_rating: 7, tags: ['exercise', 'nature'] },
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockLogs,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await moodService.getMoodByTag('user-id', 30)

      expect(result).toBeDefined()
      expect(result.work).toBeDefined() // Should have work tag stats
      expect(result.exercise).toBeDefined() // Should have exercise tag stats
    })
  })
})