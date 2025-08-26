'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function DatePicker({ 
  date, 
  onDateChange,
  className
}: {
  date?: Date
  onDateChange?: (date: Date) => void
  className?: string
}) {
  return (
    <Button
      variant="outline"
      className={cn(
        "w-[280px] justify-start text-left font-normal",
        !date && "text-muted-foreground",
        className
      )}
      onClick={() => onDateChange?.(new Date())}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP", { locale: zhCN }) : <span>选择日期</span>}
    </Button>
  )
}