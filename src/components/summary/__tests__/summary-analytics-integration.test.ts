/**
 * Daily Summary and Analytics Integration Tests
 * These tests verify the complete analytics workflow with real database operations
 */

import { taskService, userService, summaryService } from '@/lib/supabase/database'
import { supabase } from '@/lib/supabase/client'

// Test user ID for testing purposes
const TEST_USER_ID = 'analytics-test-user-' + Date.now()
const TEST_EMAIL = `analyticstest${Date.now()}@example.com`

// Helper function to create a test user
async function createTestUser() {
  const testUser = {
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: 'Analytics Test User'
  }
  
  return await userService.createProfile(testUser)
}

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    await supabase.from('daily_summaries').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('tasks').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('users').delete().eq('id', TEST_USER_ID)
  } catch (error) {
    console.warn('Cleanup warning:', error)
  }
}

// Helper function to create test data for analytics
async function createTestDataForAnalytics() {
  const dates = [
    '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05',
    '2024-01-06', '2024-01-07', '2024-01-08', '2024-01-09', '2024-01-10'
  ]

  const createdTasks = []
  const createdSummaries = []

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    
    // Create varying numbers of tasks with different completion rates
    const tasksForDay = Math.floor(Math.random() * 5) + 3 // 3-7 tasks per day
    const completionRate = 0.6 + (Math.random() * 0.4) // 60-100% completion
    const completedTasks = Math.floor(tasksForDay * completionRate)
    
    // Create tasks for this day
    for (let j = 0; j < tasksForDay; j++) {
      const isCompleted = j < completedTasks
      const estimatedMinutes = Math.floor(Math.random() * 120) + 30 // 30-150 minutes
      const actualMinutes = isCompleted ? Math.floor(estimatedMinutes * (0.8 + Math.random() * 0.4)) : undefined
      
      const task = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: `Task ${j + 1} for ${date}`,
        description: `Description for task ${j + 1}`,
        category: ['Work', 'Personal', 'Health'][j % 3],
        priority: ['low', 'medium', 'high'][j % 3] as 'low' | 'medium' | 'high',
        status: isCompleted ? 'completed' : 'pending' as 'completed' | 'pending',
        estimated_minutes: estimatedMinutes,
        actual_minutes: actualMinutes,
        due_date: date,
        completed_at: isCompleted ? new Date(date + 'T' + (10 + j) + ':00:00Z').toISOString() : undefined
      })
      createdTasks.push(task)
    }

    // Generate summary for this day
    const summary = await summaryService.generateDailySummary(TEST_USER_ID, date)
    
    // Add manual data to summary
    const updatedSummary = await summaryService.updateSummary(TEST_USER_ID, date, {
      mood_rating: Math.floor(Math.random() * 5) + 1, // 1-5
      energy_rating: Math.floor(Math.random() * 5) + 1, // 1-5
      notes: `Summary notes for ${date}`,
      achievements: [`Achievement for ${date}`, 'Completed important task'],
      challenges: ['Time management', 'Focus issues'],
      tomorrow_goals: ['Start new project', 'Exercise more']
    })
    
    createdSummaries.push(updatedSummary)
  }

  return { tasks: createdTasks, summaries: createdSummaries }
}

describe('Daily Summary and Analytics Integration Tests', () => {
  let testUser: any
  let testData: { tasks: any[]; summaries: any[] }

  beforeAll(async () => {
    await cleanupTestData()
    testUser = await createTestUser()
    testData = await createTestDataForAnalytics()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('Daily Summary Generation', () => {
    it('should generate accurate daily summary from tasks', async () => {
      const testDate = '2024-01-15'
      
      // Create specific tasks for testing
      const tasks = [
        {
          user_id: TEST_USER_ID,
          title: 'Morning workout',
          estimated_minutes: 60,
          actual_minutes: 55,
          due_date: testDate,
          status: 'completed' as const
        },
        {
          user_id: TEST_USER_ID,
          title: 'Project work',
          estimated_minutes: 120,
          actual_minutes: 130,
          due_date: testDate,
          status: 'completed' as const
        },
        {
          user_id: TEST_USER_ID,
          title: 'Team meeting',
          estimated_minutes: 45,
          due_date: testDate,
          status: 'pending' as const
        },
        {
          user_id: TEST_USER_ID,
          title: 'Email processing',
          estimated_minutes: 30,
          actual_minutes: 25,
          due_date: testDate,
          status: 'completed' as const
        }
      ]

      const createdTasks = []
      for (const taskData of tasks) {
        const task = await taskService.createTask(taskData)
        createdTasks.push(task)
      }

      // Generate summary
      const summary = await summaryService.generateDailySummary(TEST_USER_ID, testDate)

      expect(summary).toBeDefined()
      expect(summary.user_id).toBe(TEST_USER_ID)
      expect(summary.summary_date).toBe(testDate)
      expect(summary.total_tasks).toBe(4)
      expect(summary.completed_tasks).toBe(3)
      expect(summary.completion_rate).toBeCloseTo(75, 1) // 3/4 * 100
      expect(summary.total_planned_time).toBe(255) // 60 + 120 + 45 + 30
      expect(summary.total_actual_time).toBe(210) // 55 + 130 + 25
      expect(summary.productivity_score).toBeGreaterThan(0)
      expect(summary.productivity_score).toBeLessThanOrEqual(100)

      // Clean up
      for (const task of createdTasks) {
        await taskService.deleteTask(task.id)
      }
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
    })

    it('should handle edge case: no tasks for the day', async () => {
      const testDate = '2024-01-20'
      
      const summary = await summaryService.generateDailySummary(TEST_USER_ID, testDate)

      expect(summary).toBeDefined()
      expect(summary.total_tasks).toBe(0)
      expect(summary.completed_tasks).toBe(0)
      expect(summary.completion_rate).toBe(0)
      expect(summary.total_planned_time).toBe(0)
      expect(summary.total_actual_time).toBe(0)
      expect(summary.productivity_score).toBe(0)

      // Clean up
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
    })

    it('should update existing summary when regenerated', async () => {
      const testDate = '2024-01-16'
      
      // Create initial task
      const task1 = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Initial task',
        estimated_minutes: 60,
        due_date: testDate,
        status: 'completed'
      })

      // Generate first summary
      const summary1 = await summaryService.generateDailySummary(TEST_USER_ID, testDate)
      expect(summary1.total_tasks).toBe(1)

      // Add another task
      const task2 = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Additional task',
        estimated_minutes: 30,
        due_date: testDate,
        status: 'pending'
      })

      // Regenerate summary
      const summary2 = await summaryService.generateDailySummary(TEST_USER_ID, testDate)
      expect(summary2.id).toBe(summary1.id) // Same summary, updated
      expect(summary2.total_tasks).toBe(2)
      expect(summary2.completed_tasks).toBe(1)

      // Clean up
      await taskService.deleteTask(task1.id)
      await taskService.deleteTask(task2.id)
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
    })
  })

  describe('Summary CRUD Operations', () => {
    it('should create manual summary with custom data', async () => {
      const testDate = '2024-01-17'
      const summaryData = {
        user_id: TEST_USER_ID,
        summary_date: testDate,
        total_tasks: 5,
        completed_tasks: 4,
        completion_rate: 80,
        total_planned_time: 240,
        total_actual_time: 220,
        productivity_score: 85,
        mood_rating: 4,
        energy_rating: 3,
        notes: 'Had a productive day despite some challenges',
        achievements: ['Completed major project milestone', 'Had good team meeting'],
        challenges: ['Interruptions in the afternoon', 'Technical issues'],
        tomorrow_goals: ['Start next phase', 'Review feedback'],
        auto_blog_generated: false
      }

      const summary = await summaryService.createSummary(summaryData)

      expect(summary).toBeDefined()
      expect(summary.user_id).toBe(TEST_USER_ID)
      expect(summary.summary_date).toBe(testDate)
      expect(summary.mood_rating).toBe(4)
      expect(summary.energy_rating).toBe(3)
      expect(summary.notes).toBe(summaryData.notes)
      expect(summary.achievements).toEqual(summaryData.achievements)
      expect(summary.challenges).toEqual(summaryData.challenges)
      expect(summary.tomorrow_goals).toEqual(summaryData.tomorrow_goals)

      // Clean up
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
    })

    it('should retrieve summary by date', async () => {
      const testDate = '2024-01-18'
      
      const createdSummary = await summaryService.createSummary({
        user_id: TEST_USER_ID,
        summary_date: testDate,
        total_tasks: 3,
        completed_tasks: 2,
        mood_rating: 5
      })

      const retrievedSummary = await summaryService.getSummary(TEST_USER_ID, testDate)

      expect(retrievedSummary).toBeDefined()
      expect(retrievedSummary!.id).toBe(createdSummary.id)
      expect(retrievedSummary!.mood_rating).toBe(5)

      // Clean up
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
    })

    it('should return null for non-existent summary', async () => {
      const nonExistentSummary = await summaryService.getSummary(TEST_USER_ID, '2024-12-31')
      expect(nonExistentSummary).toBeNull()
    })

    it('should update summary with new data', async () => {
      const testDate = '2024-01-19'
      
      const summary = await summaryService.createSummary({
        user_id: TEST_USER_ID,
        summary_date: testDate,
        mood_rating: 3,
        notes: 'Original notes'
      })

      const updatedSummary = await summaryService.updateSummary(TEST_USER_ID, testDate, {
        mood_rating: 5,
        energy_rating: 4,
        notes: 'Updated notes with more details',
        achievements: ['New achievement added'],
        auto_blog_generated: true
      })

      expect(updatedSummary.mood_rating).toBe(5)
      expect(updatedSummary.energy_rating).toBe(4)
      expect(updatedSummary.notes).toBe('Updated notes with more details')
      expect(updatedSummary.achievements).toEqual(['New achievement added'])
      expect(updatedSummary.auto_blog_generated).toBe(true)

      // Clean up
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
    })
  })

  describe('Analytics and Trends', () => {
    it('should get summaries with date range filtering', async () => {
      const summaries = await summaryService.getSummaries(TEST_USER_ID, {
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        limit: 10
      })

      expect(summaries).toBeDefined()
      expect(Array.isArray(summaries)).toBe(true)
      expect(summaries.length).toBeGreaterThan(0)
      expect(summaries.length).toBeLessThanOrEqual(5)

      // Check date range
      summaries.forEach(summary => {
        expect(summary.summary_date).toMatch(/^2024-01-0[1-5]$/)
      })

      // Check ordering (most recent first)
      for (let i = 1; i < summaries.length; i++) {
        expect(summaries[i-1].summary_date).toBeGreaterThanOrEqual(summaries[i].summary_date)
      }
    })

    it('should get productivity trends', async () => {
      const trends = await summaryService.getProductivityTrends(TEST_USER_ID, 10)

      expect(trends).toBeDefined()
      expect(trends.daily).toBeDefined()
      expect(Array.isArray(trends.daily)).toBe(true)
      expect(trends.averages).toBeDefined()

      // Check daily data structure
      if (trends.daily.length > 0) {
        const dayData = trends.daily[0]
        expect(dayData).toHaveProperty('date')
        expect(dayData).toHaveProperty('completion_rate')
        expect(dayData).toHaveProperty('productivity_score')
        expect(dayData).toHaveProperty('total_tasks')
        expect(dayData).toHaveProperty('completed_tasks')
      }

      // Check averages
      expect(trends.averages).toHaveProperty('avg_completion_rate')
      expect(trends.averages).toHaveProperty('avg_productivity_score')
      expect(trends.averages).toHaveProperty('avg_tasks_per_day')
      expect(trends.averages).toHaveProperty('trend_direction')

      expect(typeof trends.averages.avg_completion_rate).toBe('number')
      expect(typeof trends.averages.avg_productivity_score).toBe('number')
      expect(typeof trends.averages.avg_tasks_per_day).toBe('number')
      expect(['up', 'down', 'stable']).toContain(trends.averages.trend_direction)
    })

    it('should calculate correct productivity metrics', async () => {
      const testDate = '2024-01-21'
      
      // Create tasks with known metrics
      const tasks = [
        {
          user_id: TEST_USER_ID,
          title: 'Efficient task',
          estimated_minutes: 60,
          actual_minutes: 50, // Under time = good
          due_date: testDate,
          status: 'completed' as const
        },
        {
          user_id: TEST_USER_ID,
          title: 'Over-time task',
          estimated_minutes: 30,
          actual_minutes: 45, // Over time = less efficient
          due_date: testDate,
          status: 'completed' as const
        },
        {
          user_id: TEST_USER_ID,
          title: 'Incomplete task',
          estimated_minutes: 90,
          due_date: testDate,
          status: 'pending' as const
        }
      ]

      const createdTasks = []
      for (const taskData of tasks) {
        const task = await taskService.createTask(taskData)
        createdTasks.push(task)
      }

      const summary = await summaryService.generateDailySummary(TEST_USER_ID, testDate)

      // Completion rate: 2/3 = 66.67%
      expect(summary.completion_rate).toBeCloseTo(66.67, 1)
      
      // Time efficiency: planned 180, actual 95
      expect(summary.total_planned_time).toBe(180)
      expect(summary.total_actual_time).toBe(95)
      
      // Productivity score should be reasonable
      expect(summary.productivity_score).toBeGreaterThan(40)
      expect(summary.productivity_score).toBeLessThan(80)

      // Clean up
      for (const task of createdTasks) {
        await taskService.deleteTask(task.id)
      }
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
    })

    it('should handle pagination in summaries', async () => {
      const page1 = await summaryService.getSummaries(TEST_USER_ID, {
        limit: 3,
        offset: 0
      })
      const page2 = await summaryService.getSummaries(TEST_USER_ID, {
        limit: 3,
        offset: 3
      })

      expect(page1.length).toBeLessThanOrEqual(3)
      expect(page2.length).toBeLessThanOrEqual(3)

      // Check that pages are different (if we have enough data)
      if (page1.length > 0 && page2.length > 0) {
        const page1Dates = page1.map(s => s.summary_date)
        const page2Dates = page2.map(s => s.summary_date)
        const overlap = page1Dates.filter(date => page2Dates.includes(date))
        expect(overlap.length).toBe(0)
      }
    })
  })

  describe('Advanced Analytics', () => {
    it('should identify productivity patterns', async () => {
      const trends = await summaryService.getProductivityTrends(TEST_USER_ID, 10)

      if (trends.daily.length >= 7) {
        // Test trend direction calculation
        expect(['up', 'down', 'stable']).toContain(trends.averages.trend_direction)

        // Verify data consistency
        const totalScore = trends.daily.reduce((sum, day) => sum + day.productivity_score, 0)
        const expectedAvg = totalScore / trends.daily.length
        expect(trends.averages.avg_productivity_score).toBeCloseTo(expectedAvg, 1)
      }
    })

    it('should handle missing data gracefully', async () => {
      // Create a user with no data
      const emptyUserTrends = await summaryService.getProductivityTrends(TEST_USER_ID + '-empty', 30)

      expect(emptyUserTrends).toBeDefined()
      expect(emptyUserTrends.daily).toEqual([])
      expect(emptyUserTrends.averages.avg_completion_rate).toBe(0)
      expect(emptyUserTrends.averages.avg_productivity_score).toBe(0)
      expect(emptyUserTrends.averages.avg_tasks_per_day).toBe(0)
      expect(emptyUserTrends.averages.trend_direction).toBe('stable')
    })

    it('should maintain data integrity across operations', async () => {
      const testDate = '2024-01-22'
      
      // Create, update, and verify summary
      let summary = await summaryService.createSummary({
        user_id: TEST_USER_ID,
        summary_date: testDate,
        total_tasks: 4,
        completed_tasks: 3,
        completion_rate: 75,
        mood_rating: 4
      })

      // Update mood and add achievements
      summary = await summaryService.updateSummary(TEST_USER_ID, testDate, {
        mood_rating: 5,
        achievements: ['Completed project', 'Good team collaboration']
      })

      // Verify data integrity
      const retrieved = await summaryService.getSummary(TEST_USER_ID, testDate)
      expect(retrieved!.total_tasks).toBe(4) // Original data preserved
      expect(retrieved!.completed_tasks).toBe(3) // Original data preserved
      expect(retrieved!.completion_rate).toBe(75) // Original data preserved
      expect(retrieved!.mood_rating).toBe(5) // Updated data
      expect(retrieved!.achievements).toEqual(['Completed project', 'Good team collaboration']) // New data

      // Clean up
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
    })
  })
})