import React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e)
      }
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
    }

    return (
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={id}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
            className
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }