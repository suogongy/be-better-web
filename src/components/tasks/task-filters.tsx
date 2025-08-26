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
  onFiltersChange: (filters: any) => void
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
    { value: 'pending', label: 'To Do', count: 0 },
    { value: 'in_progress', label: 'In Progress', count: 0 },
    { value: 'completed', label: 'Completed', count: 0 },
    { value: 'cancelled', label: 'Cancelled', count: 0 },
  ]

  const priorityOptions = [
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  ]

  const sortOptions = [
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'created_at', label: 'Created' },
    { value: 'title', label: 'Title' },
  ]

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilter = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
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

  const activeFiltersCount = Object.keys(filters).filter(key => 
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
                placeholder="Search tasks..."
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
                    Sort by {option.label}
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
              Filters
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
                <label className="block text-sm font-medium mb-2">Status</label>
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
                <label className="block text-sm font-medium mb-2">Priority</label>
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
                  <label className="block text-sm font-medium mb-2">Category</label>
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
                    Clear all filters
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
                  Status: {filters.status.replace('_', ' ')}
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
                  Priority: {filters.priority}
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
                  Category: {filters.category}
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