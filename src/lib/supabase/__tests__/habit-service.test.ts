import { habitService } from '@/lib/supabase/advanced-services'
import { supabase } from '@/lib/supabase/client'
import { testDataGenerators } from '@/lib/testing/utils'

// Mock Supabase client
jest.mock('@/lib/supabase/client')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('habitService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getHabits', () => {
    it('should fetch active habits by default', async () => {
      const mockHabits = [
        testDataGenerators.createHabit({ name: 'Morning Exercise' }),
        testDataGenerators.createHabit({ name: 'Read Books' }),
      ]

      // Mock habits query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'habits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: mockHabits,
                error: null,
              }),
            }),
          }
        }
        // Mock habit_logs query
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }
      } as any)

      const result = await habitService.getHabits('user-id')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Morning Exercise')
      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
    })

    it('should include inactive habits when requested', async () => {
      const mockHabits = [
        testDataGenerators.createHabit({ name: 'Active Habit', is_active: true }),
        testDataGenerators.createHabit({ name: 'Inactive Habit', is_active: false }),
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'habits') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockHabits,
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }
      } as any)

      const result = await habitService.getHabits('user-id', { includeInactive: true })

      expect(result).toHaveLength(2)
    })

    it('should throw error on database failure', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any)

      await expect(habitService.getHabits('user-id'))
        .rejects
        .toThrow('Failed to fetch habits')
    })
  })

  describe('createHabit', () => {
    it('should create a new habit successfully', async () => {
      const habitData = {
        user_id: 'user-id',
        name: 'New Habit',
        description: 'A new habit to track',
        frequency: 'daily' as const,
        target_count: 1,
        color: '#3B82F6',
        icon: 'circle',
      }

      const mockCreatedHabit = testDataGenerators.createHabit(habitData)

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedHabit,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await habitService.createHabit(habitData)

      expect(result).toEqual(mockCreatedHabit)
      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
    })

    it('should throw error on creation failure', async () => {
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

      await expect(habitService.createHabit({
        user_id: 'user-id',
        name: 'Failed Habit',
        frequency: 'daily',
        target_count: 1,
      }))
        .rejects
        .toThrow('Failed to create habit')
    })
  })

  describe('updateHabit', () => {
    it('should update habit successfully', async () => {
      const updates = {
        name: 'Updated Habit Name',
        target_count: 2,
      }

      const mockUpdatedHabit = testDataGenerators.createHabit(updates)

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedHabit,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await habitService.updateHabit('habit-id', updates)

      expect(result).toEqual(mockUpdatedHabit)
      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
    })
  })

  describe('deleteHabit', () => {
    it('should delete habit successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      await habitService.deleteHabit('habit-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
    })

    it('should throw error on deletion failure', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      } as any)

      await expect(habitService.deleteHabit('habit-id'))
        .rejects
        .toThrow('Failed to delete habit')
    })
  })

  describe('logHabit', () => {
    it('should log habit completion successfully', async () => {
      const logData = {
        habit_id: 'habit-id',
        user_id: 'user-id',
        log_date: '2023-01-01',
        completed_count: 1,
        target_count: 1,
      }

      const mockLog = {
        id: 'log-id',
        ...logData,
        created_at: new Date().toISOString(),
      }

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLog,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await habitService.logHabit(logData)

      expect(result).toEqual(mockLog)
      expect(mockSupabase.from).toHaveBeenCalledWith('habit_logs')
    })
  })

  describe('getHabitStats', () => {
    it('should calculate habit statistics correctly', async () => {
      const mockHabits = [
        testDataGenerators.createHabit({ is_active: true }),
        testDataGenerators.createHabit({ is_active: true }),
        testDataGenerators.createHabit({ is_active: false }),
      ]

      const today = new Date().toISOString().split('T')[0]
      const mockTodayLogs = [
        { habit_id: 'habit-1', completed_count: 1, target_count: 1 },
      ]

      mockSupabase.from.mockImplementation((table) => {
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
        if (table === 'habit_logs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockTodayLogs,
                  error: null,
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

      const result = await habitService.getHabitStats('user-id')

      expect(result.total_habits).toBe(3)
      expect(result.active_habits).toBe(2)
      expect(result.completed_today).toBe(1)
    })
  })

  describe('getHabitStreak', () => {
    it('should calculate current streak correctly', async () => {
      // Mock consecutive daily logs
      const mockLogs = [
        { log_date: '2023-01-05', completed_count: 1, target_count: 1 },
        { log_date: '2023-01-04', completed_count: 1, target_count: 1 },
        { log_date: '2023-01-03', completed_count: 1, target_count: 1 },
        { log_date: '2023-01-01', completed_count: 1, target_count: 1 }, // Gap here
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockLogs,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await habitService.getHabitStreak('habit-id')

      expect(result.current_streak).toBe(3) // 3 consecutive days
      expect(result.best_streak).toBeGreaterThanOrEqual(3)
    })
  })

  describe('getHabitAnalytics', () => {
    it('should generate analytics data', async () => {
      const mockLogs = Array.from({ length: 30 }, (_, i) => ({
        log_date: new Date(2023, 0, i + 1).toISOString().split('T')[0],
        completed_count: i % 2 === 0 ? 1 : 0, // 50% completion rate
        target_count: 1,
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

      const result = await habitService.getHabitAnalytics('habit-id', 30)

      expect(result.completion_rate).toBeCloseTo(50, 1)
      expect(result.total_days).toBe(30)
      expect(result.completed_days).toBe(15)
    })
  })
})