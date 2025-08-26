import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitTracker } from '@/components/habits/habit-tracker'
import { renderWithProviders, testDataGenerators, serviceMocks } from '@/lib/testing/utils'
import * as advancedServices from '@/lib/supabase/advanced-services'

// Mock the advanced services
jest.mock('@/lib/supabase/advanced-services')

const mockHabitService = serviceMocks.createHabitServiceMock()
const mockedAdvancedServices = advancedServices as jest.Mocked<typeof advancedServices>

describe('HabitTracker', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default mock implementations
    mockedAdvancedServices.habitService = mockHabitService
  })

  it('renders loading state initially', () => {
    renderWithProviders(<HabitTracker />, {
      initialAuth: { user: testDataGenerators.createUser(), loading: false }
    })

    expect(screen.getByText('Loading habits...')).toBeInTheDocument()
  })

  it('renders empty state when no habits exist', async () => {
    mockHabitService.getHabits.mockResolvedValue([])
    mockHabitService.getHabitStats.mockResolvedValue({
      total_habits: 0,
      active_habits: 0,
      completed_today: 0,
      longest_streak: 0,
      completion_rate: 0,
    })

    renderWithProviders(<HabitTracker />, {
      initialAuth: { user: testDataGenerators.createUser(), loading: false }
    })

    await waitFor(() => {
      expect(screen.getByText('No Habits Yet')).toBeInTheDocument()
    })

    expect(screen.getByText('Start building positive habits to track your progress.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create your first habit/i })).toBeInTheDocument()
  })

  it('displays habit stats correctly', async () => {
    const mockStats = {
      total_habits: 5,
      active_habits: 4,
      completed_today: 2,
      longest_streak: 15,
      completion_rate: 85,
    }

    mockHabitService.getHabits.mockResolvedValue([])
    mockHabitService.getHabitStats.mockResolvedValue(mockStats)

    renderWithProviders(<HabitTracker />, {
      initialAuth: { user: testDataGenerators.createUser(), loading: false }
    })

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument() // Active habits
      expect(screen.getByText('2')).toBeInTheDocument() // Completed today
      expect(screen.getByText('15')).toBeInTheDocument() // Best streak
      expect(screen.getByText('85%')).toBeInTheDocument() // Completion rate
    })
  })

  it('renders habits list correctly', async () => {
    const mockHabits = [
      {
        ...testDataGenerators.createHabit({
          name: 'Morning Exercise',
          streak_count: 7,
          completion_rate: 85,
        }),
        recent_logs: [],
      },
      {
        ...testDataGenerators.createHabit({
          name: 'Read 30 minutes',
          streak_count: 3,
          completion_rate: 70,
        }),
        recent_logs: [],
      },
    ]

    mockHabitService.getHabits.mockResolvedValue(mockHabits)
    mockHabitService.getHabitStats.mockResolvedValue({
      total_habits: 2,
      active_habits: 2,
      completed_today: 0,
      longest_streak: 7,
      completion_rate: 77.5,
    })

    renderWithProviders(<HabitTracker />, {
      initialAuth: { user: testDataGenerators.createUser(), loading: false }
    })

    await waitFor(() => {
      expect(screen.getByText('Morning Exercise')).toBeInTheDocument()
      expect(screen.getByText('Read 30 minutes')).toBeInTheDocument()
    })

    // Check for streak information
    expect(screen.getByText('7 day streak')).toBeInTheDocument()
    expect(screen.getByText('3 day streak')).toBeInTheDocument()

    // Check for completion rates
    expect(screen.getByText('85% completion')).toBeInTheDocument()
    expect(screen.getByText('70% completion')).toBeInTheDocument()
  })

  it('allows logging a habit', async () => {
    const user = userEvent.setup()
    const mockHabit = {
      ...testDataGenerators.createHabit({
        name: 'Daily Meditation',
      }),
      recent_logs: [],
    }

    mockHabitService.getHabits.mockResolvedValue([mockHabit])
    mockHabitService.getHabitStats.mockResolvedValue({
      total_habits: 1,
      active_habits: 1,
      completed_today: 0,
      longest_streak: 0,
      completion_rate: 0,
    })
    mockHabitService.logHabit.mockResolvedValue({
      id: 'log-id',
      habit_id: mockHabit.id,
      user_id: mockHabit.user_id,
      log_date: new Date().toISOString().split('T')[0],
      completed_count: 1,
      target_count: 1,
      created_at: new Date().toISOString(),
    })

    renderWithProviders(<HabitTracker />, {
      initialAuth: { user: testDataGenerators.createUser(), loading: false }
    })

    await waitFor(() => {
      expect(screen.getByText('Daily Meditation')).toBeInTheDocument()
    })

    // Find and click the completion button
    const completionButton = screen.getByRole('button', { name: /circle/i })
    await user.click(completionButton)

    await waitFor(() => {
      expect(mockHabitService.logHabit).toHaveBeenCalledWith({
        habit_id: mockHabit.id,
        user_id: mockHabit.user_id,
        log_date: expect.any(String),
        completed_count: 1,
      })
    })
  })

  it('calls onCreateHabit when add habit button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnCreateHabit = jest.fn()

    mockHabitService.getHabits.mockResolvedValue([])
    mockHabitService.getHabitStats.mockResolvedValue({
      total_habits: 0,
      active_habits: 0,
      completed_today: 0,
      longest_streak: 0,
      completion_rate: 0,
    })

    renderWithProviders(
      <HabitTracker onCreateHabit={mockOnCreateHabit} />,
      {
        initialAuth: { user: testDataGenerators.createUser(), loading: false }
      }
    )

    await waitFor(() => {
      expect(screen.getByText('No Habits Yet')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /create your first habit/i })
    await user.click(addButton)

    expect(mockOnCreateHabit).toHaveBeenCalledTimes(1)
  })

  it('calls onEditHabit when settings button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnEditHabit = jest.fn()
    const mockHabit = {
      ...testDataGenerators.createHabit({
        name: 'Test Habit',
      }),
      recent_logs: [],
    }

    mockHabitService.getHabits.mockResolvedValue([mockHabit])
    mockHabitService.getHabitStats.mockResolvedValue({
      total_habits: 1,
      active_habits: 1,
      completed_today: 0,
      longest_streak: 0,
      completion_rate: 0,
    })

    renderWithProviders(
      <HabitTracker onEditHabit={mockOnEditHabit} />,
      {
        initialAuth: { user: testDataGenerators.createUser(), loading: false }
      }
    )

    await waitFor(() => {
      expect(screen.getByText('Test Habit')).toBeInTheDocument()
    })

    const settingsButton = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsButton)

    expect(mockOnEditHabit).toHaveBeenCalledWith(mockHabit)
  })

  it('handles API errors gracefully', async () => {
    mockHabitService.getHabits.mockRejectedValue(new Error('API Error'))
    mockHabitService.getHabitStats.mockRejectedValue(new Error('API Error'))

    // Mock console.error to prevent error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    renderWithProviders(<HabitTracker />, {
      initialAuth: { user: testDataGenerators.createUser(), loading: false }
    })

    // Should eventually show some error state or fallback
    await waitFor(() => {
      // The component should handle the error gracefully
      expect(screen.queryByText('Loading habits...')).not.toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('shows completed habits with correct styling', async () => {
    const today = new Date().toISOString().split('T')[0]
    const mockHabit = {
      ...testDataGenerators.createHabit({
        name: 'Completed Habit',
      }),
      recent_logs: [{
        id: 'log-1',
        habit_id: 'habit-1',
        user_id: 'user-1',
        log_date: today,
        completed_count: 1,
        target_count: 1,
        created_at: new Date().toISOString(),
      }],
    }

    mockHabitService.getHabits.mockResolvedValue([mockHabit])
    mockHabitService.getHabitStats.mockResolvedValue({
      total_habits: 1,
      active_habits: 1,
      completed_today: 1,
      longest_streak: 1,
      completion_rate: 100,
    })

    renderWithProviders(<HabitTracker />, {
      initialAuth: { user: testDataGenerators.createUser(), loading: false }
    })

    await waitFor(() => {
      expect(screen.getByText('Completed Habit')).toBeInTheDocument()
    })

    // Check for completed styling (the habit card should have green background)
    const habitCard = screen.getByText('Completed Habit').closest('div')
    expect(habitCard).toHaveClass('bg-green-50', 'border-green-200')
  })
})