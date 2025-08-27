'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskFiltersProps {
  filters: {
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    category?: string
    priority?: 'low' | 'medium' | 'high'
    search?: string
    sortBy?: 'due_date' | 'priority' | 'created_at' | 'title'
    sortOrder?: 'asc' | 'desc'
  }
  categories: string[]
  onFiltersChange: (filters: {
    status?: string
    category?: string
    priority?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => void
  className?: string
}

export function TaskFilters({ 
  filters, 
  categories, 
  onFiltersChange, 
  className 
}: TaskFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const statusOptions = [
    { value: 'pending', label: '待办', count: 0 },
    { value: 'in_progress', label: '进行中', count: 0 },
    { value: 'completed', label: '已完成', count: 0 },
    { value: 'cancelled', label: '已取消', count: 0 },
  ]

  const priorityOptions = [
    { value: 'high', label: '高', color: 'bg-red-100 text-red-800' },
    { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'low', label: '低', color: 'bg-green-100 text-green-800' },
  ]

  const sortOptions = [
    { value: 'due_date', label: '截止日期' },
    { value: 'priority', label: '优先级' },
    { value: 'created_at', label: '创建时间' },
    { value: 'title', label: '标题' },
  ]

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilter = (key: keyof typeof filters) => {
    const newFilters = { ...filters }
    delete (newFilters as any)[key]
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      sortBy: 'due_date',
      sortOrder: 'asc'
    })
  }

  const toggleSortOrder = () => {
    updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const activeFiltersCount = (Object.keys(filters) as Array<keyof typeof filters>).filter(key => 
    key !== 'sortBy' && key !== 'sortOrder' && filters[key]
  ).length

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search and Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索任务..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
              {filters.search && (
                <button
                  onClick={() => clearFilter('search')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={filters.sortBy || 'due_date'}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-foreground"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    按 {option.label} 排序
                  </option>
                ))}
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="px-3"
              >
                {filters.sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Advanced Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              筛选器
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                showAdvanced && "rotate-180"
              )} />
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">状态</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => 
                        filters.status === option.value 
                          ? clearFilter('status')
                          : updateFilter('status', option.value)
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-sm border transition-colors",
                        filters.status === option.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">优先级</label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => 
                        filters.priority === option.value 
                          ? clearFilter('priority')
                          : updateFilter('priority', option.value)
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-sm border transition-colors",
                        filters.priority === option.value
                          ? "ring-2 ring-primary ring-offset-2"
                          : "",
                        option.color
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">分类</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => 
                          filters.category === category 
                            ? clearFilter('category')
                            : updateFilter('category', category)
                        }
                        className={cn(
                          "px-3 py-1 rounded-full text-sm border transition-colors",
                          filters.category === category
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear All */}
              {activeFiltersCount > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    清除所有筛选
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && !showAdvanced && (
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  状态： {filters.status.replace('_', ' ')}
                  <button
                    onClick={() => clearFilter('status')}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.priority && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  优先级： {filters.priority}
                  <button
                    onClick={() => clearFilter('priority')}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  分类： {filters.category}
                  <button
                    onClick={() => clearFilter('category')}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}