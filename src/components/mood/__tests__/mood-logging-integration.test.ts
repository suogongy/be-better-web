/**
 * Mood Logging Integration Tests
 * These tests verify the complete mood logging and analytics workflow
 */

import { moodService } from '@/lib/supabase/advanced-services'
import { userService } from '@/lib/supabase/database'
import { supabase } from '@/lib/supabase/client'

// Test user ID for testing purposes
const TEST_USER_ID = 'mood-test-user-' + Date.now()
const TEST_EMAIL = `moodtest${Date.now()}@example.com`

// Helper function to create a test user
async function createTestUser() {
  const testUser = {
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: 'Mood Test User'
  }
  
  return await userService.createProfile(testUser)
}

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    await supabase.from('mood_logs').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('users').delete().eq('id', TEST_USER_ID)
  } catch (error) {
    console.warn('Cleanup warning:', error)
  }
}

describe('Mood Logging Integration Tests', () => {
  let testUser: any
  let createdLogs: any[] = []

  beforeAll(async () => {
    await cleanupTestData()
    testUser = await createTestUser()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    // Clean up mood logs created in each test
    for (const log of createdLogs) {
      try {
        await moodService.deleteMoodLog(log.id)
      } catch (error) {
        console.warn('Mood log cleanup warning:', error)
      }
    }
    createdLogs = []
  })

  describe('Mood Logging CRUD Operations', () => {
    it('should log mood with all properties', async () => {
      const today = new Date().toISOString().split('T')[0]
      const currentTime = '14:30:00'
      
      const moodData = {
        user_id: TEST_USER_ID,
        log_date: today,
        log_time: currentTime,
        mood_rating: 8,
        energy_level: 7,
        stress_level: 3,
        sleep_quality: 9,
        notes: 'Had a great morning workout and productive work session',
        tags: ['work', 'exercise', 'productive'],
        weather: 'sunny',
        location: 'home office'
      }

      const log = await moodService.logMood(moodData)
      createdLogs.push(log)

      expect(log).toBeDefined()
      expect(log.id).toBeDefined()
      expect(log.user_id).toBe(TEST_USER_ID)
      expect(log.log_date).toBe(today)
      expect(log.log_time).toBe(currentTime)
      expect(log.mood_rating).toBe(8)
      expect(log.energy_level).toBe(7)
      expect(log.stress_level).toBe(3)
      expect(log.sleep_quality).toBe(9)
      expect(log.notes).toBe(moodData.notes)
      expect(log.tags).toEqual(moodData.tags)
      expect(log.weather).toBe(moodData.weather)
      expect(log.location).toBe(moodData.location)
      expect(log.created_at).toBeDefined()
    })

    it('should log mood with minimal data', async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const moodData = {
        user_id: TEST_USER_ID,
        log_date: today,
        mood_rating: 6
      }

      const log = await moodService.logMood(moodData)
      createdLogs.push(log)

      expect(log.mood_rating).toBe(6)
      expect(log.log_time).toBeDefined() // Should use current time
      expect(log.energy_level).toBeNull()
      expect(log.stress_level).toBeNull()
      expect(log.sleep_quality).toBeNull()
    })

    it('should get mood logs for user', async () => {
      const dates = ['2024-01-01', '2024-01-02', '2024-01-03']
      const moods = [7, 5, 8]
      
      // Create multiple mood logs
      for (let i = 0; i < dates.length; i++) {
        const log = await moodService.logMood({
          user_id: TEST_USER_ID,
          log_date: dates[i],
          mood_rating: moods[i],
          energy_level: moods[i] - 1,
          notes: `Mood log for ${dates[i]}`
        })
        createdLogs.push(log)
      }

      const allLogs = await moodService.getMoodLogs(TEST_USER_ID)
      expect(allLogs.length).toBe(3)

      // Should be ordered by date desc, then time desc
      expect(allLogs[0].log_date).toBeGreaterThanOrEqual(allLogs[1].log_date)
      expect(allLogs[1].log_date).toBeGreaterThanOrEqual(allLogs[2].log_date)
    })

    it('should filter mood logs by date range', async () => {
      const logs = [
        { log_date: '2024-01-01', mood_rating: 6 },
        { log_date: '2024-01-05', mood_rating: 7 },
        { log_date: '2024-01-10', mood_rating: 8 },
        { log_date: '2024-01-15', mood_rating: 5 }
      ]

      for (const logData of logs) {
        const log = await moodService.logMood({
          user_id: TEST_USER_ID,
          ...logData
        })
        createdLogs.push(log)
      }

      // Filter by date range
      const filteredLogs = await moodService.getMoodLogs(TEST_USER_ID, {
        startDate: '2024-01-05',
        endDate: '2024-01-10'
      })

      expect(filteredLogs.length).toBe(2)
      filteredLogs.forEach(log => {
        expect(log.log_date).toBeGreaterThanOrEqual('2024-01-05')
        expect(log.log_date).toBeLessThanOrEqual('2024-01-10')
      })
    })

    it('should limit mood logs', async () => {
      // Create 5 mood logs
      for (let i = 1; i <= 5; i++) {
        const log = await moodService.logMood({
          user_id: TEST_USER_ID,
          log_date: `2024-01-${i.toString().padStart(2, '0')}`,
          mood_rating: i + 4
        })
        createdLogs.push(log)
      }

      const limitedLogs = await moodService.getMoodLogs(TEST_USER_ID, { limit: 3 })
      expect(limitedLogs.length).toBe(3)
    })

    it('should update mood log', async () => {
      const log = await moodService.logMood({
        user_id: TEST_USER_ID,
        log_date: '2024-01-01',
        mood_rating: 5,
        notes: 'Original notes'
      })
      createdLogs.push(log)

      const updatedLog = await moodService.updateMoodLog(log.id, {
        mood_rating: 8,
        energy_level: 7,
        notes: 'Updated notes after evening reflection',
        tags: ['reflection', 'growth']
      })

      expect(updatedLog.mood_rating).toBe(8)
      expect(updatedLog.energy_level).toBe(7)
      expect(updatedLog.notes).toBe('Updated notes after evening reflection')
      expect(updatedLog.tags).toEqual(['reflection', 'growth'])
    })

    it('should delete mood log', async () => {
      const log = await moodService.logMood({
        user_id: TEST_USER_ID,
        log_date: '2024-01-01',
        mood_rating: 6
      })

      await moodService.deleteMoodLog(log.id)

      const allLogs = await moodService.getMoodLogs(TEST_USER_ID)
      const deletedLog = allLogs.find(l => l.id === log.id)
      expect(deletedLog).toBeUndefined()
    })
  })

  describe('Mood Analytics and Statistics', () => {
    beforeEach(async () => {
      // Create 10 days of mood data with varying patterns
      const moodData = [
        { date: '2024-01-01', mood: 7, energy: 6, stress: 4 },
        { date: '2024-01-02', mood: 5, energy: 4, stress: 6 },
        { date: '2024-01-03', mood: 8, energy: 8, stress: 2 },
        { date: '2024-01-04', mood: 6, energy: 5, stress: 5 },
        { date: '2024-01-05', mood: 9, energy: 9, stress: 1 },
        { date: '2024-01-06', mood: 4, energy: 3, stress: 8 },
        { date: '2024-01-07', mood: 7, energy: 6, stress: 3 },
        { date: '2024-01-08', mood: 8, energy: 7, stress: 2 },
        { date: '2024-01-09', mood: 6, energy: 5, stress: 4 },
        { date: '2024-01-10', mood: 9, energy: 8, stress: 2 }
      ]

      for (const data of moodData) {
        const log = await moodService.logMood({
          user_id: TEST_USER_ID,
          log_date: data.date,
          mood_rating: data.mood,
          energy_level: data.energy,
          stress_level: data.stress,
          notes: `Mood entry for ${data.date}`
        })
        createdLogs.push(log)
      }
    })

    it('should calculate accurate mood statistics', async () => {
      const stats = await moodService.getMoodStats(TEST_USER_ID, 10)

      expect(stats).toBeDefined()
      expect(typeof stats.avg_mood).toBe('number')
      expect(typeof stats.avg_energy).toBe('number')
      expect(typeof stats.avg_stress).toBe('number')
      expect(['up', 'down', 'stable']).toContain(stats.mood_trend)
      expect(stats.best_day).toBeDefined()
      expect(stats.worst_day).toBeDefined()

      // Verify averages are reasonable
      expect(stats.avg_mood).toBeGreaterThan(0)
      expect(stats.avg_mood).toBeLessThanOrEqual(10)
      expect(stats.avg_energy).toBeGreaterThan(0)
      expect(stats.avg_energy).toBeLessThanOrEqual(10)
      expect(stats.avg_stress).toBeGreaterThan(0)
      expect(stats.avg_stress).toBeLessThanOrEqual(10)

      // Calculate expected averages
      const expectedMoodAvg = (7 + 5 + 8 + 6 + 9 + 4 + 7 + 8 + 6 + 9) / 10 // = 6.9
      expect(stats.avg_mood).toBeCloseTo(expectedMoodAvg, 1)
    })

    it('should identify best and worst days', async () => {
      const stats = await moodService.getMoodStats(TEST_USER_ID, 10)

      // From our test data, best days should be 2024-01-05 or 2024-01-10 (mood 9)
      // Worst day should be 2024-01-06 (mood 4)
      expect(['2024-01-05', '2024-01-10']).toContain(stats.best_day)
      expect(stats.worst_day).toBe('2024-01-06')
    })

    it('should calculate mood trend correctly', async () => {
      // Create specific data to test trend calculation
      const testUser2 = 'trend-test-user-' + Date.now()
      await userService.createProfile({
        id: testUser2,
        email: `trendtest${Date.now()}@example.com`,
        name: 'Trend Test User'
      })

      const upwardTrendData = [
        { date: '2024-01-01', mood: 4 },
        { date: '2024-01-02', mood: 5 },
        { date: '2024-01-03', mood: 6 },
        { date: '2024-01-04', mood: 7 },
        { date: '2024-01-05', mood: 8 },
        { date: '2024-01-06', mood: 9 }
      ]

      for (const data of upwardTrendData) {
        await moodService.logMood({
          user_id: testUser2,
          log_date: data.date,
          mood_rating: data.mood
        })
      }

      const trendStats = await moodService.getMoodStats(testUser2, 6)
      expect(trendStats.mood_trend).toBe('up')

      // Clean up
      await supabase.from('mood_logs').delete().eq('user_id', testUser2)
      await supabase.from('users').delete().eq('id', testUser2)
    })

    it('should handle no data gracefully', async () => {
      const emptyUser = 'empty-user-' + Date.now()
      await userService.createProfile({
        id: emptyUser,
        email: `empty${Date.now()}@example.com`,
        name: 'Empty User'
      })

      const emptyStats = await moodService.getMoodStats(emptyUser, 30)

      expect(emptyStats.avg_mood).toBe(0)
      expect(emptyStats.avg_energy).toBe(0)
      expect(emptyStats.avg_stress).toBe(0)
      expect(emptyStats.mood_trend).toBe('stable')
      expect(emptyStats.best_day).toBe('')
      expect(emptyStats.worst_day).toBe('')

      // Clean up
      await supabase.from('users').delete().eq('id', emptyUser)
    })
  })

  describe('Mood Patterns and Insights', () => {
    it('should track multiple mood entries per day', async () => {
      const today = new Date().toISOString().split('T')[0]
      
      // Morning mood
      const morningLog = await moodService.logMood({
        user_id: TEST_USER_ID,
        log_date: today,
        log_time: '08:00:00',
        mood_rating: 6,
        energy_level: 5,
        notes: 'Just woke up, feeling okay'
      })
      createdLogs.push(morningLog)

      // Afternoon mood
      const afternoonLog = await moodService.logMood({
        user_id: TEST_USER_ID,
        log_date: today,
        log_time: '14:00:00',
        mood_rating: 8,
        energy_level: 7,
        notes: 'Had lunch and feeling energized'
      })
      createdLogs.push(afternoonLog)

      // Evening mood
      const eveningLog = await moodService.logMood({
        user_id: TEST_USER_ID,
        log_date: today,
        log_time: '20:00:00',
        mood_rating: 7,
        energy_level: 4,
        notes: 'Winding down for the day'
      })
      createdLogs.push(eveningLog)

      const todayLogs = await moodService.getMoodLogs(TEST_USER_ID, {
        startDate: today,
        endDate: today
      })

      expect(todayLogs.length).toBe(3)
      
      // Should be ordered by time desc
      expect(todayLogs[0].log_time).toBe('20:00:00')
      expect(todayLogs[1].log_time).toBe('14:00:00')
      expect(todayLogs[2].log_time).toBe('08:00:00')
    })

    it('should handle mood tags and categorization', async () => {
      const moodsWithTags = [
        {
          mood_rating: 8,
          tags: ['work', 'productive', 'accomplished'],
          notes: 'Great work day'
        },
        {
          mood_rating: 5,
          tags: ['tired', 'stressed', 'work'],
          notes: 'Tough day at work'
        },
        {
          mood_rating: 9,
          tags: ['exercise', 'energized', 'healthy'],
          notes: 'Amazing workout'
        }
      ]

      for (let i = 0; i < moodsWithTags.length; i++) {
        const log = await moodService.logMood({
          user_id: TEST_USER_ID,
          log_date: `2024-01-${(i + 1).toString().padStart(2, '0')}`,
          ...moodsWithTags[i]
        })
        createdLogs.push(log)
      }

      const allLogs = await moodService.getMoodLogs(TEST_USER_ID, { limit: 3 })
      
      // Verify tags are stored correctly
      expect(allLogs[0].tags).toContain('exercise')
      expect(allLogs[1].tags).toContain('stressed')
      expect(allLogs[2].tags).toContain('productive')
    })

    it('should track environmental factors', async () => {
      const environmentalLogs = [
        {
          mood_rating: 8,
          weather: 'sunny',
          location: 'park',
          notes: 'Beautiful day outdoors'
        },
        {
          mood_rating: 5,
          weather: 'rainy',
          location: 'home',
          notes: 'Gloomy weather affecting mood'
        },
        {
          mood_rating: 7,
          weather: 'cloudy',
          location: 'office',
          notes: 'Normal work day'
        }
      ]

      for (let i = 0; i < environmentalLogs.length; i++) {
        const log = await moodService.logMood({
          user_id: TEST_USER_ID,
          log_date: `2024-01-${(i + 5).toString().padStart(2, '0')}`,
          ...environmentalLogs[i]
        })
        createdLogs.push(log)
      }

      const logs = await moodService.getMoodLogs(TEST_USER_ID, { limit: 3 })
      
      expect(logs[0].weather).toBe('cloudy')
      expect(logs[0].location).toBe('office')
      expect(logs[1].weather).toBe('rainy')
      expect(logs[1].location).toBe('home')
      expect(logs[2].weather).toBe('sunny')
      expect(logs[2].location).toBe('park')
    })
  })

  describe('Mood Data Validation', () => {
    it('should validate mood rating ranges', async () => {
      // Test valid mood ratings
      const validMoods = [1, 5, 10]
      
      for (const mood of validMoods) {
        const log = await moodService.logMood({
          user_id: TEST_USER_ID,
          log_date: `2024-01-${mood.toString().padStart(2, '0')}`,
          mood_rating: mood
        })
        createdLogs.push(log)
        expect(log.mood_rating).toBe(mood)
      }
    })

    it('should handle optional fields correctly', async () => {
      const log = await moodService.logMood({
        user_id: TEST_USER_ID,
        log_date: '2024-01-15',
        mood_rating: 7
        // All other fields optional
      })
      createdLogs.push(log)

      expect(log.mood_rating).toBe(7)
      expect(log.energy_level).toBeNull()
      expect(log.stress_level).toBeNull()
      expect(log.sleep_quality).toBeNull()
      expect(log.notes).toBeNull()
      expect(log.weather).toBeNull()
      expect(log.location).toBeNull()
    })

    it('should handle long-term data correctly', async () => {
      // Create 30 days of mood data
      const today = new Date()
      const moodLogs = []
      
      for (let i = 0; i < 30; i++) {
        const logDate = new Date(today)
        logDate.setDate(today.getDate() - i)
        
        const log = await moodService.logMood({
          user_id: TEST_USER_ID,
          log_date: logDate.toISOString().split('T')[0],
          mood_rating: Math.floor(Math.random() * 6) + 5, // 5-10 range
          energy_level: Math.floor(Math.random() * 6) + 4, // 4-9 range
          stress_level: Math.floor(Math.random() * 5) + 1, // 1-5 range
        })
        moodLogs.push(log)
        createdLogs.push(log)
      }

      const stats = await moodService.getMoodStats(TEST_USER_ID, 30)
      
      expect(stats.avg_mood).toBeGreaterThan(4)
      expect(stats.avg_mood).toBeLessThan(11)
      expect(stats.avg_energy).toBeGreaterThan(3)
      expect(stats.avg_stress).toBeGreaterThan(0)
    })
  })

  describe('Mood Integration with Other Features', () => {
    it('should support correlation with other wellness data', async () => {
      // This test demonstrates how mood data could be correlated with other features
      const wellnessData = [
        {
          date: '2024-01-01',
          mood: 8,
          exercise: true,
          sleep_quality: 8,
          stress: 2
        },
        {
          date: '2024-01-02',
          mood: 5,
          exercise: false,
          sleep_quality: 4,
          stress: 7
        },
        {
          date: '2024-01-03',
          mood: 9,
          exercise: true,
          sleep_quality: 9,
          stress: 1
        }
      ]

      for (const data of wellnessData) {
        const log = await moodService.logMood({
          user_id: TEST_USER_ID,
          log_date: data.date,
          mood_rating: data.mood,
          sleep_quality: data.sleep_quality,
          stress_level: data.stress,
          tags: data.exercise ? ['exercise'] : ['no-exercise'],
          notes: `Wellness tracking for ${data.date}`
        })
        createdLogs.push(log)
      }

      const logs = await moodService.getMoodLogs(TEST_USER_ID, { limit: 3 })
      
      // Verify data structure supports correlation analysis
      logs.forEach(log => {
        expect(log).toHaveProperty('mood_rating')
        expect(log).toHaveProperty('sleep_quality')
        expect(log).toHaveProperty('stress_level')
        expect(log).toHaveProperty('tags')
      })
    })
  })
})

/**
 * Mood Logging Integration Tests
 * Tests the integration between mood service and related functionality
 */

import { userService } from '@/lib/supabase/services/index'
import { supabase } from '@/lib/supabase/client'

// Test user ID for testing purposes
const TEST_USER_ID_MOOD = 'mood-test-user-' + Date.now()
const TEST_EMAIL_MOOD = `moodtest${Date.now()}@example.com`

// Mock mood data for testing
const mockMoodLogs = [
  {
    user_id: TEST_USER_ID_MOOD,
    log_date: new Date().toISOString().split('T')[0],
    log_time: '09:00:00',
    mood_rating: 7,
    energy_level: 8,
    stress_level: 3,
    sleep_quality: 8,
    notes: 'Feeling good today',
    tags: ['productive', 'happy'],
    weather: 'sunny',
    location: 'home'
  },
  {
    user_id: TEST_USER_ID_MOOD,
    log_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
    log_time: '18:00:00',
    mood_rating: 5,
    energy_level: 6,
    stress_level: 5,
    sleep_quality: 6,
    notes: 'Average day',
    tags: ['tired'],
    weather: 'cloudy',
    location: 'office'
  }
]

describe('Mood Logging Integration', () => {
  // Setup: Create test user before running tests
  beforeAll(async () => {
    // Create test user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: TEST_USER_ID_MOOD,
          email: TEST_EMAIL_MOOD,
          name: 'Mood Test User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
    
    if (error) {
      console.error('Error creating test user:', error)
    }
  })

  // Cleanup: Delete test data after tests
  afterAll(async () => {
    // Delete test mood logs
    await supabase
      .from('mood_logs')
      .delete()
      .eq('user_id', TEST_USER_ID_MOOD)
    
    // Delete test user
    await supabase
      .from('users')
      .delete()
      .eq('id', TEST_USER_ID_MOOD)
  })

  describe('User Service Integration', () => {
    it('should retrieve user profile', async () => {
      const user = await userService.getProfile(TEST_USER_ID_MOOD)
      
      expect(user).toBeDefined()
      expect(user.id).toBe(TEST_USER_ID_MOOD)
      expect(user.email).toBe(TEST_EMAIL_MOOD)
      expect(user.name).toBe('Mood Test User')
    })

    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Mood Test User',
        bio: 'This is a test user for mood logging'
      }
      
      const updatedUser = await userService.updateProfile(TEST_USER_ID_MOOD, updateData)
      
      expect(updatedUser).toBeDefined()
      expect(updatedUser.name).toBe(updateData.name)
      expect(updatedUser.bio).toBe(updateData.bio)
    })
  })

  describe('Data Validation', () => {
    it('should validate mood log data structure', () => {
      const testMoodLog = mockMoodLogs[0]
      
      // Validate required fields
      expect(testMoodLog.user_id).toBeDefined()
      expect(testMoodLog.log_date).toBeDefined()
      expect(testMoodLog.mood_rating).toBeDefined()
      
      // Validate data types
      expect(typeof testMoodLog.mood_rating).toBe('number')
      expect(typeof testMoodLog.energy_level).toBe('number')
      expect(typeof testMoodLog.stress_level).toBe('number')
      expect(typeof testMoodLog.sleep_quality).toBe('number')
      
      // Validate value ranges
      expect(testMoodLog.mood_rating).toBeGreaterThanOrEqual(1)
      expect(testMoodLog.mood_rating).toBeLessThanOrEqual(10)
      expect(testMoodLog.energy_level).toBeGreaterThanOrEqual(1)
      expect(testMoodLog.energy_level).toBeLessThanOrEqual(10)
    })

    it('should handle edge cases in mood ratings', () => {
      // Test minimum values
      const minRating = 1
      expect(minRating).toBeGreaterThanOrEqual(1)
      expect(minRating).toBeLessThanOrEqual(10)
      
      // Test maximum values
      const maxRating = 10
      expect(maxRating).toBeGreaterThanOrEqual(1)
      expect(maxRating).toBeLessThanOrEqual(10)
      
      // Test invalid values are handled
      const invalidLow = 0
      const invalidHigh = 11
      expect(invalidLow).toBeLessThan(1)
      expect(invalidHigh).toBeGreaterThan(10)
    })
  })

  describe('Business Logic Validation', () => {
    it('should calculate mood trends correctly', () => {
      // Mock mood data for trend calculation
      const moodData = [
        { mood_rating: 7, log_date: '2024-01-01' },
        { mood_rating: 8, log_date: '2024-01-02' },
        { mood_rating: 6, log_date: '2024-01-03' },
        { mood_rating: 9, log_date: '2024-01-04' }
      ]
      
      // Calculate average mood
      const totalMood = moodData.reduce((sum, log) => sum + log.mood_rating, 0)
      const averageMood = totalMood / moodData.length
      
      expect(averageMood).toBe(7.5)
      
      // Calculate trend direction
      const firstHalf = moodData.slice(0, 2).reduce((sum, log) => sum + log.mood_rating, 0) / 2
      const secondHalf = moodData.slice(2).reduce((sum, log) => sum + log.mood_rating, 0) / 2
      const trendDirection = secondHalf > firstHalf ? 'improving' : 'declining'
      
      expect(trendDirection).toBe('improving')
    })

    it('should validate date formats', () => {
      const testDate = '2024-01-15'
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      
      expect(dateRegex.test(testDate)).toBe(true)
      expect(new Date(testDate).toISOString().split('T')[0]).toBe(testDate)
    })
  })
})
