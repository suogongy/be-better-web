/**
 * Habit Tracking Integration Tests
 * These tests verify the complete habit tracking workflow with real database operations
 */

import { habitService } from '@/lib/supabase/advanced-services'
import { userService } from '@/lib/supabase/database'
import { supabase } from '@/lib/supabase/client'

// Test user ID for testing purposes
const TEST_USER_ID = 'habit-test-user-' + Date.now()
const TEST_EMAIL = `habitest${Date.now()}@example.com`

// Helper function to create a test user
async function createTestUser() {
  const testUser = {
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: 'Habit Test User'
  }
  
  return await userService.createProfile(testUser)
}

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    await supabase.from('habit_logs').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('habits').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('users').delete().eq('id', TEST_USER_ID)
  } catch (error) {
    console.warn('Cleanup warning:', error)
  }
}

describe('Habit Tracking Integration Tests', () => {
  let testUser: any
  let createdHabits: any[] = []

  beforeAll(async () => {
    await cleanupTestData()
    testUser = await createTestUser()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    // Clean up habits created in each test
    for (const habit of createdHabits) {
      try {
        await habitService.deleteHabit(habit.id)
      } catch (error) {
        console.warn('Habit cleanup warning:', error)
      }
    }
    createdHabits = []
  })

  describe('Habit CRUD Operations', () => {
    it('should create a habit with all properties', async () => {
      const habitData = {
        user_id: TEST_USER_ID,
        name: 'Daily Exercise',
        description: 'Do 30 minutes of exercise every day',
        category: 'Health',
        frequency: 'daily' as const,
        target_count: 1,
        color: '#10B981',
        icon: 'run',
        reminder_time: '07:00',
        reminder_enabled: true
      }

      const habit = await habitService.createHabit(habitData)
      createdHabits.push(habit)

      expect(habit).toBeDefined()
      expect(habit.id).toBeDefined()
      expect(habit.name).toBe(habitData.name)
      expect(habit.description).toBe(habitData.description)
      expect(habit.category).toBe(habitData.category)
      expect(habit.frequency).toBe(habitData.frequency)
      expect(habit.target_count).toBe(habitData.target_count)
      expect(habit.color).toBe(habitData.color)
      expect(habit.icon).toBe(habitData.icon)
      expect(habit.reminder_time).toBe(habitData.reminder_time)
      expect(habit.reminder_enabled).toBe(habitData.reminder_enabled)
      expect(habit.is_active).toBe(true)
      expect(habit.streak_count).toBe(0)
      expect(habit.best_streak).toBe(0)
      expect(habit.user_id).toBe(TEST_USER_ID)
      expect(habit.created_at).toBeDefined()
      expect(habit.updated_at).toBeDefined()
    })

    it('should create habit with default values', async () => {
      const habitData = {
        user_id: TEST_USER_ID,
        name: 'Read Books'
      }

      const habit = await habitService.createHabit(habitData)
      createdHabits.push(habit)

      expect(habit.frequency).toBe('daily')
      expect(habit.target_count).toBe(1)
      expect(habit.color).toBe('#3B82F6')
      expect(habit.icon).toBe('circle')
      expect(habit.reminder_enabled).toBe(false)
      expect(habit.is_active).toBe(true)
    })

    it('should get habits for user', async () => {
      const habits = [
        { user_id: TEST_USER_ID, name: 'Morning Exercise', category: 'Health' },
        { user_id: TEST_USER_ID, name: 'Evening Reading', category: 'Education' },
        { user_id: TEST_USER_ID, name: 'Meditation', category: 'Wellness', is_active: false }
      ]

      for (const habitData of habits) {
        const habit = await habitService.createHabit(habitData)
        createdHabits.push(habit)
      }

      // Get all habits (including inactive)
      const allHabits = await habitService.getHabits(TEST_USER_ID, { includeInactive: true })
      expect(allHabits.length).toBe(3)

      // Get only active habits
      const activeHabits = await habitService.getHabits(TEST_USER_ID)
      expect(activeHabits.length).toBe(2)

      // Test structure of returned habits
      const firstHabit = allHabits[0]
      expect(firstHabit).toHaveProperty('recent_logs')
      expect(firstHabit).toHaveProperty('completion_rate')
      expect(firstHabit).toHaveProperty('current_streak')
      expect(Array.isArray(firstHabit.recent_logs)).toBe(true)
    })

    it('should filter habits by category', async () => {
      const habits = [
        { user_id: TEST_USER_ID, name: 'Workout', category: 'Health' },
        { user_id: TEST_USER_ID, name: 'Study', category: 'Education' },
        { user_id: TEST_USER_ID, name: 'Yoga', category: 'Health' }
      ]

      for (const habitData of habits) {
        const habit = await habitService.createHabit(habitData)
        createdHabits.push(habit)
      }

      const healthHabits = await habitService.getHabits(TEST_USER_ID, { category: 'Health' })
      expect(healthHabits.length).toBe(2)
      healthHabits.forEach(habit => expect(habit.category).toBe('Health'))

      const educationHabits = await habitService.getHabits(TEST_USER_ID, { category: 'Education' })
      expect(educationHabits.length).toBe(1)
      expect(educationHabits[0].category).toBe('Education')
    })

    it('should update habit properties', async () => {
      const habit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Original Name',
        category: 'Original Category'
      })
      createdHabits.push(habit)

      const updatedHabit = await habitService.updateHabit(habit.id, {
        name: 'Updated Name',
        description: 'Updated description',
        category: 'Updated Category',
        target_count: 3,
        color: '#EF4444',
        reminder_enabled: true
      })

      expect(updatedHabit.name).toBe('Updated Name')
      expect(updatedHabit.description).toBe('Updated description')
      expect(updatedHabit.category).toBe('Updated Category')
      expect(updatedHabit.target_count).toBe(3)
      expect(updatedHabit.color).toBe('#EF4444')
      expect(updatedHabit.reminder_enabled).toBe(true)
    })

    it('should delete a habit', async () => {
      const habit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Habit to Delete'
      })

      await habitService.deleteHabit(habit.id)

      const allHabits = await habitService.getHabits(TEST_USER_ID, { includeInactive: true })
      const deletedHabit = allHabits.find(h => h.id === habit.id)
      expect(deletedHabit).toBeUndefined()
    })
  })

  describe('Habit Logging', () => {
    let testHabit: any

    beforeEach(async () => {
      testHabit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Test Logging Habit',
        target_count: 1
      })
      createdHabits.push(testHabit)
    })

    it('should log habit completion', async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const log = await habitService.logHabit({
        habit_id: testHabit.id,
        user_id: TEST_USER_ID,
        log_date: today,
        completed_count: 1,
        target_count: 1,
        notes: 'Completed successfully',
        mood_after: 4
      })

      expect(log).toBeDefined()
      expect(log.habit_id).toBe(testHabit.id)
      expect(log.user_id).toBe(TEST_USER_ID)
      expect(log.log_date).toBe(today)
      expect(log.completed_count).toBe(1)
      expect(log.target_count).toBe(1)
      expect(log.notes).toBe('Completed successfully')
      expect(log.mood_after).toBe(4)
      expect(log.created_at).toBeDefined()
    })

    it('should handle partial completion', async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const log = await habitService.logHabit({
        habit_id: testHabit.id,
        user_id: TEST_USER_ID,
        log_date: today,
        completed_count: 2,
        target_count: 3,
        notes: 'Partially completed'
      })

      expect(log.completed_count).toBe(2)
      expect(log.target_count).toBe(3)
    })

    it('should update existing log when logging same date', async () => {
      const today = new Date().toISOString().split('T')[0]
      
      // First log
      await habitService.logHabit({
        habit_id: testHabit.id,
        user_id: TEST_USER_ID,
        log_date: today,
        completed_count: 1,
        notes: 'First attempt'
      })

      // Second log for same date (should upsert)
      const updatedLog = await habitService.logHabit({
        habit_id: testHabit.id,
        user_id: TEST_USER_ID,
        log_date: today,
        completed_count: 2,
        notes: 'Updated attempt'
      })

      expect(updatedLog.completed_count).toBe(2)
      expect(updatedLog.notes).toBe('Updated attempt')

      // Verify only one log exists for this date
      const logs = await habitService.getHabitLogs(testHabit.id, {
        startDate: today,
        endDate: today
      })
      expect(logs.length).toBe(1)
    })

    it('should get habit logs with filtering', async () => {
      const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
      
      // Create logs for multiple dates
      for (let i = 0; i < dates.length; i++) {
        await habitService.logHabit({
          habit_id: testHabit.id,
          user_id: TEST_USER_ID,
          log_date: dates[i],
          completed_count: i + 1
        })
      }

      // Get all logs
      const allLogs = await habitService.getHabitLogs(testHabit.id)
      expect(allLogs.length).toBe(5)

      // Get logs with date range
      const rangedLogs = await habitService.getHabitLogs(testHabit.id, {
        startDate: '2024-01-02',
        endDate: '2024-01-04'
      })
      expect(rangedLogs.length).toBe(3)

      // Get limited logs
      const limitedLogs = await habitService.getHabitLogs(testHabit.id, { limit: 2 })
      expect(limitedLogs.length).toBe(2)
      
      // Should be ordered by date desc
      expect(limitedLogs[0].log_date).toBeGreaterThanOrEqual(limitedLogs[1].log_date)
    })
  })

  describe('Habit Statistics and Analytics', () => {
    beforeEach(async () => {
      // Create multiple habits with different completion patterns
      const habits = [
        { name: 'Daily Exercise', category: 'Health', is_active: true },
        { name: 'Reading', category: 'Education', is_active: true },
        { name: 'Meditation', category: 'Wellness', is_active: true },
        { name: 'Old Habit', category: 'Other', is_active: false }
      ]

      for (const habitData of habits) {
        const habit = await habitService.createHabit({
          user_id: TEST_USER_ID,
          ...habitData
        })
        createdHabits.push(habit)

        // Log some activities for active habits
        if (habitData.is_active) {
          const today = new Date()
          for (let i = 0; i < 5; i++) {
            const logDate = new Date(today)
            logDate.setDate(today.getDate() - i)
            
            if (Math.random() > 0.3) { // 70% completion rate
              await habitService.logHabit({
                habit_id: habit.id,
                user_id: TEST_USER_ID,
                log_date: logDate.toISOString().split('T')[0],
                completed_count: 1
              })
            }
          }
        }
      }
    })

    it('should get accurate habit statistics', async () => {
      const stats = await habitService.getHabitStats(TEST_USER_ID)

      expect(stats).toBeDefined()
      expect(stats.total_habits).toBe(4)
      expect(stats.active_habits).toBe(3)
      expect(stats.completed_today).toBeGreaterThanOrEqual(0)
      expect(stats.longest_streak).toBeGreaterThanOrEqual(0)
      expect(stats.completion_rate).toBeGreaterThanOrEqual(0)
      expect(stats.completion_rate).toBeLessThanOrEqual(100)
    })

    it('should calculate habit completion rate', async () => {
      const habit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Completion Rate Test',
        frequency: 'daily',
        target_count: 1
      })
      createdHabits.push(habit)

      // Log for 7 out of 10 days
      const today = new Date()
      const completedDays = [0, 1, 2, 4, 5, 7, 8] // 7 days out of 10
      
      for (const dayOffset of completedDays) {
        const logDate = new Date(today)
        logDate.setDate(today.getDate() - dayOffset)
        
        await habitService.logHabit({
          habit_id: habit.id,
          user_id: TEST_USER_ID,
          log_date: logDate.toISOString().split('T')[0],
          completed_count: 1
        })
      }

      const completionRate = await habitService.getHabitCompletionRate(habit.id, 10)
      expect(completionRate).toBeCloseTo(70, 5) // 70% completion rate
    })

    it('should get habit categories', async () => {
      const categories = await habitService.getHabitCategories(TEST_USER_ID)

      expect(categories).toBeDefined()
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
      expect(categories).toContain('Health')
      expect(categories).toContain('Education')
      expect(categories).toContain('Wellness')
    })
  })

  describe('Habit Frequency Patterns', () => {
    it('should handle daily habits correctly', async () => {
      const habit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Daily Habit',
        frequency: 'daily',
        target_count: 1
      })
      createdHabits.push(habit)

      // Log for 5 consecutive days
      const today = new Date()
      for (let i = 0; i < 5; i++) {
        const logDate = new Date(today)
        logDate.setDate(today.getDate() - i)
        
        await habitService.logHabit({
          habit_id: habit.id,
          user_id: TEST_USER_ID,
          log_date: logDate.toISOString().split('T')[0],
          completed_count: 1
        })
      }

      const completionRate = await habitService.getHabitCompletionRate(habit.id, 5)
      expect(completionRate).toBe(100)
    })

    it('should handle weekly habits correctly', async () => {
      const habit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Weekly Habit',
        frequency: 'weekly',
        target_count: 2
      })
      createdHabits.push(habit)

      // Log activities to meet weekly target
      const today = new Date()
      await habitService.logHabit({
        habit_id: habit.id,
        user_id: TEST_USER_ID,
        log_date: today.toISOString().split('T')[0],
        completed_count: 2,
        target_count: 2
      })

      const logs = await habitService.getHabitLogs(habit.id, { limit: 5 })
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].completed_count).toBe(2)
    })

    it('should handle multiple completions per day', async () => {
      const habit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Multi-count Habit',
        frequency: 'daily',
        target_count: 3
      })
      createdHabits.push(habit)

      const today = new Date().toISOString().split('T')[0]
      
      const log = await habitService.logHabit({
        habit_id: habit.id,
        user_id: TEST_USER_ID,
        log_date: today,
        completed_count: 2,
        target_count: 3,
        notes: 'Partially completed'
      })

      expect(log.completed_count).toBe(2)
      expect(log.target_count).toBe(3)

      // Update to complete fully
      const updatedLog = await habitService.logHabit({
        habit_id: habit.id,
        user_id: TEST_USER_ID,
        log_date: today,
        completed_count: 3,
        target_count: 3,
        notes: 'Fully completed'
      })

      expect(updatedLog.completed_count).toBe(3)
      expect(updatedLog.notes).toBe('Fully completed')
    })
  })

  describe('Habit Streaks and Motivation', () => {
    it('should track habit streaks (basic test)', async () => {
      const habit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Streak Habit',
        frequency: 'daily'
      })
      createdHabits.push(habit)

      // Log for consecutive days
      const today = new Date()
      for (let i = 0; i < 3; i++) {
        const logDate = new Date(today)
        logDate.setDate(today.getDate() - i)
        
        await habitService.logHabit({
          habit_id: habit.id,
          user_id: TEST_USER_ID,
          log_date: logDate.toISOString().split('T')[0],
          completed_count: 1
        })
      }

      // Note: Streak calculation would need database functions to work properly
      // This test verifies the logging mechanism works
      const logs = await habitService.getHabitLogs(habit.id, { limit: 3 })
      expect(logs.length).toBe(3)
      
      // All logs should be completed
      logs.forEach(log => {
        expect(log.completed_count).toBeGreaterThan(0)
      })
    })

    it('should track mood after habit completion', async () => {
      const habit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Mood Tracking Habit'
      })
      createdHabits.push(habit)

      const today = new Date().toISOString().split('T')[0]
      
      const log = await habitService.logHabit({
        habit_id: habit.id,
        user_id: TEST_USER_ID,
        log_date: today,
        completed_count: 1,
        mood_after: 4,
        notes: 'Felt great after completing this!'
      })

      expect(log.mood_after).toBe(4)
      expect(log.notes).toBe('Felt great after completing this!')
    })
  })

  describe('Habit Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      const habit = await habitService.createHabit({
        user_id: TEST_USER_ID,
        name: 'Integrity Test Habit'
      })
      createdHabits.push(habit)

      // Create logs
      const today = new Date().toISOString().split('T')[0]
      await habitService.logHabit({
        habit_id: habit.id,
        user_id: TEST_USER_ID,
        log_date: today,
        completed_count: 1
      })

      // Verify logs exist
      const logs = await habitService.getHabitLogs(habit.id)
      expect(logs.length).toBe(1)

      // Delete habit should cascade delete logs
      await habitService.deleteHabit(habit.id)
      createdHabits = createdHabits.filter(h => h.id !== habit.id)

      // Verify logs are deleted
      const logsAfterDeletion = await habitService.getHabitLogs(habit.id)
      expect(logsAfterDeletion.length).toBe(0)
    })

    it('should handle edge cases gracefully', async () => {
      // Test with non-existent habit
      const nonExistentLogs = await habitService.getHabitLogs('non-existent-id')
      expect(nonExistentLogs).toEqual([])

      // Test completion rate for non-existent habit
      const nonExistentRate = await habitService.getHabitCompletionRate('non-existent-id')
      expect(nonExistentRate).toBe(0)
    })
  })
})