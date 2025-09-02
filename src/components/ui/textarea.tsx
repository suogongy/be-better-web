import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors",
  {
    variants: {
      variant: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
      },
      size: {
        sm: "px-2 py-1 text-xs min-h-[60px]",
        default: "px-3 py-2 text-sm min-h-[80px]",
        lg: "px-4 py-3 text-base min-h-[100px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string
  maxLength?: number
  showCharCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    error, 
    maxLength,
    showCharCount,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [charCount, setCharCount] = React.useState(0)

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (maxLength && e.target.value.length > maxLength) {
        e.target.value = e.target.value.slice(0, maxLength)
      }
      setCharCount(e.target.value.length)
      onChange?.(e)
    }

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            textareaVariants({ variant, size }),
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />
        {(showCharCount || maxLength) && (
          <div className="flex justify-between items-center mt-1.5">
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {(showCharCount || maxLength) && (
              <span className={cn(
                "text-xs",
                maxLength && charCount > maxLength * 0.9 
                  ? "text-destructive" 
                  : "text-muted-foreground"
              )}>
                {charCount}
                {maxLength && ` / ${maxLength}`}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }