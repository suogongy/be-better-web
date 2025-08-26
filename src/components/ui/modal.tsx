'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

function Modal({ isOpen, onClose, title, children, className, showCloseButton = true }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          'relative bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

const ModalHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex items-center justify-between p-6 border-b', className)}>
    {children}
  </div>
)

const ModalTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn('text-lg font-semibold', className)}>
    {children}
  </h2>
)

const ModalContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('p-6', className)}>
    {children}
  </div>
)

const ModalFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex items-center justify-end gap-2 p-6 border-t', className)}>
    {children}
  </div>
)

export { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter }