const TaskCalendar = ({ 
  tasks, 
  onTaskClick, 
  onDateClick, 
  onTaskMove, 
  onCreateTask,
  className 
}: TaskCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null)
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)

  // Transform tasks to calendar tasks with display dates
  const calendarTasks: CalendarTask[] = tasks
    .filter(task => task.due_date)
    .map(task => ({
      ...task,
      displayDate: parseISO(task.due_date!)
    }))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Start on Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getTasksForDate = (date: Date): CalendarTask[] => {
    return calendarTasks.filter(task => 
      isSameDay(task.displayDate, date)
    )
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 border-red-600'
      case 'medium':
        return 'bg-yellow-500 border-yellow-600'
      case 'low':
        return 'bg-green-500 border-green-600'
      default:
        return 'bg-gray-500 border-gray-600'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'opacity-60 line-through'
      case 'in_progress':
        return 'border-l-4 border-blue-500'
      case 'cancelled':
        return 'opacity-40 line-through'
      default:
        return ''
    }
  }

  const handleDragStart = (e: React.DragEvent, task: CalendarTask) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverDate(null)
  }

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(date)
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    setDragOverDate(null)
    
    if (draggedTask && !isSameDay(draggedTask.displayDate, date)) {
      onTaskMove(draggedTask.id, format(date, 'yyyy-MM-dd'))
    }
    
    setDraggedTask(null)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            任务日历
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              今天
            </Button>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center font-semibold">
                {format(currentDate, 'yyyy年MM月', { locale: zhCN })}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {/* Day Headers */}
          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
            <div 
              key={day} 
              className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {days.map(day => {
            const dayTasks = getTasksForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)
            const isDragOver = dragOverDate && isSameDay(dragOverDate, day)
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "bg-background min-h-[120px] p-1 cursor-pointer transition-colors group",
                  !isCurrentMonth && "text-muted-foreground bg-muted/50",
                  isDayToday && "bg-primary/5 border-primary",
                  isDragOver && "bg-blue-50 border-2 border-blue-300 border-dashed"
                )}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                onClick={() => onDateClick(day)}
              >
                {/* Date Number */}
                <div className={cn(
                  "flex items-center justify-between mb-1",
                  isDayToday && "font-bold text-primary"
                )}>
                  <span className="text-sm p-1">
                    {format(day, 'd')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCreateTask(day)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Tasks for this day */}
                <div className="space-y-1 max-h-[calc(100%-3rem)] overflow-y-auto">
                  {dayTasks.map((task, index) => (
                    <div
                      key={`${task.id}-${index}`}
                      className={cn(
                        "text-xs p-1 rounded border cursor-pointer transition-all hover:bg-muted/50",
                        getPriorityColor(task.priority),
                        getStatusColor(task.status),
                        "group flex items-center justify-between"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTaskClick(task)
                      }}
                    >
                      <div className="truncate max-w-[80%]">
                        {task.title}
                      </div>
                      {task.is_recurring && (
                        <Repeat className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default TaskCalendar