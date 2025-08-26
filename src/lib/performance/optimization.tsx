import React, { lazy, Suspense, useEffect } from 'react'

// Bundle size analysis utilities
export const bundleUtils = {
  // Lazy load component with loading state
  lazyWithLoading: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ReactNode
  ) => {
    const LazyComponent = lazy(importFn)
    
    return function Component(props: React.ComponentProps<T>) {
      return (
        <Suspense fallback={fallback || <div>Loading...</div>}>
          <LazyComponent {...props} />
        </Suspense>
      )
    }
  },
}

// Performance monitoring
export const performanceUtils = {
  // Measure component render time
  measureRender: (componentName: string) => {
    return <T extends React.ComponentType<any>>(Component: T) => {
      const WrappedComponent = (props: React.ComponentProps<T>) => {
        useEffect(() => {
          const start = performance.now()
          return () => {
            const end = performance.now()
            console.log(`${componentName} render time: ${end - start}ms`)
          }
        }, [])

        return <Component {...props} />
      }
      
      return WrappedComponent
    }
  },
}