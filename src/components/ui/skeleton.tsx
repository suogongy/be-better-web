import React from 'react'
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '@/lib/utils'

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "",
        circular: "rounded-full",
        text: "rounded",
        card: "rounded-lg",
      },
      size: {
        xs: "h-2",
        sm: "h-4",
        md: "h-6",
        lg: "h-8",
        xl: "h-12",
        full: "h-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  lines?: number
  width?: string | number
  lastWidth?: string | number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, size, lines = 1, width, lastWidth, ...props }, ref) => {
    const getWidthClass = (w?: string | number) => {
      if (!w) return ''
      if (typeof w === 'number') return `w-[${w}px]`
      return `w-${w}`
    }

    if (lines > 1) {
      return (
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {Array.from({ length: lines - 1 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                skeletonVariants({ variant: "text", size }),
                getWidthClass(width),
                "w-full"
              )}
            />
          ))}
          <div
            className={cn(
              skeletonVariants({ variant: "text", size }),
              getWidthClass(lastWidth || width),
              lastWidth ? getWidthClass(lastWidth) : "w-3/4"
            )}
          />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          skeletonVariants({ variant, size }),
          getWidthClass(width),
          width === 'full' && 'w-full',
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Predefined skeleton components for common use cases
const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-4 p-6", className)} {...props}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" size="md" className="h-12 w-12" />
      <div className="space-y-2 flex-1">
        <Skeleton size="sm" className="h-4 w-1/3" />
        <Skeleton size="xs" className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton lines={3} />
  </div>
)

const SkeletonList = ({ 
  count = 3, 
  className, 
  ...props 
}: { count?: number } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-4", className)} {...props}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton variant="circular" size="sm" className="h-10 w-10" />
        <div className="space-y-2 flex-1">
          <Skeleton size="sm" className="h-4 w-1/4" />
          <Skeleton size="xs" className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
)

const SkeletonTable = ({ 
  rows = 3, 
  columns = 4, 
  className, 
  ...props 
}: { rows?: number; columns?: number } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-3", className)} {...props}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} size="sm" className="flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={`cell-${rowIndex}-${colIndex}`} 
            size="xs" 
            className="flex-1" 
          />
        ))}
      </div>
    ))}
  </div>
)

export { Skeleton, SkeletonCard, SkeletonList, SkeletonTable, skeletonVariants }