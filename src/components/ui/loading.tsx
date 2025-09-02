import React from 'react'
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '@/lib/utils'

const loadingVariants = cva(
  "relative inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        spinner: "",
        dots: "",
        bars: "",
        pulse: "",
      },
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "spinner",
      size: "md",
    },
  }
)

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string
  center?: boolean
  overlay?: boolean
}

const LoadingSpinner = ({ size }: { size: "xs" | "sm" | "md" | "lg" | "xl" }) => {
  const sizeClasses = {
    xs: "h-3 w-3 border-[2px]",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
    xl: "h-12 w-12 border-4",
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-current border-r-transparent",
        sizeClasses[size]
      )}
    />
  )
}

const LoadingDots = ({ size }: { size: "xs" | "sm" | "md" | "lg" | "xl" }) => {
  const dotSize = {
    xs: "h-1 w-1",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
    xl: "h-4 w-4",
  }

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "animate-bounce rounded-full bg-current",
            dotSize[size]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: "1.4s",
          }}
        />
      ))}
    </div>
  )
}

const LoadingBars = ({ size }: { size: "xs" | "sm" | "md" | "lg" | "xl" }) => {
  const barSize = {
    xs: "h-3 w-1",
    sm: "h-4 w-1.5",
    md: "h-6 w-2",
    lg: "h-8 w-2.5",
    xl: "h-12 w-3",
  }

  return (
    <div className="flex space-x-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-sm bg-current",
            barSize[size]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

const LoadingPulse = ({ size }: { size: "xs" | "sm" | "md" | "lg" | "xl" }) => {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  }

  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-current opacity-75",
        sizeClasses[size]
      )}
    />
  )
}

function Loading({
  className,
  variant = "spinner",
  size = "md",
  text,
  center = false,
  overlay = false,
  ...props
}: LoadingProps) {
  const containerClasses = cn(
    "inline-flex items-center justify-center gap-2",
    center && "w-full",
    overlay && "fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999]",
    className
  )

  const textClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  }

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <LoadingDots size={size} />
      case "bars":
        return <LoadingBars size={size} />
      case "pulse":
        return <LoadingPulse size={size} />
      default:
        return <LoadingSpinner size={size} />
    }
  }

  return (
    <div className={containerClasses} {...props}>
      {renderLoader()}
      {text && (
        <span className={cn("text-muted-foreground", textClasses[size])}>
          {text}
        </span>
      )}
    </div>
  )
}

export { Loading, loadingVariants }