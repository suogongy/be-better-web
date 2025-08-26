import React from 'react'

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ orientation = 'horizontal', className, ...props }, ref) => {
    const isHorizontal = orientation === 'horizontal'
    
    return (
      <div
        ref={ref}
        className={`bg-border ${isHorizontal ? 'h-px w-full' : 'h-full w-px'} ${className}`}
        {...props}
      />
    )
  }
)

Separator.displayName = 'Separator'

export { Separator }