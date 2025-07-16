'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastActionElement = React.ReactElement | undefined

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'custom'

export type ToastProps = {
  id?: string | number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  type?: ToastType
  title?: React.ReactNode
  message?: React.ReactNode
  action?: ToastActionElement
  duration?: number
}

type ToastContextType = {
  toast: {
    success: (message: string, options?: Partial<ToastProps>) => string | number
    error: (message: string, options?: Partial<ToastProps>) => string | number
    warning: (message: string, options?: Partial<ToastProps>) => string | number
    info: (message: string, options?: Partial<ToastProps>) => string | number
    custom: (toast: ToastProps) => string | number
  }
  removeToast: (id: string | number) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = (toast: ToastProps): string | number => {
    const id = Date.now() + Math.random()
    const newToast: ToastProps = {
      id,
      duration: 5000,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)

    return id
  }

  const removeToast = (id: string | number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const toast = {
    success: (message: string, options: Partial<ToastProps> = {}) =>
      addToast({
        type: 'success',
        title: 'Success',
        message,
        ...options,
      }),
    error: (message: string, options: Partial<ToastProps> = {}) =>
      addToast({
        type: 'error',
        title: 'Error',
        message,
        ...options,
      }),
    warning: (message: string, options: Partial<ToastProps> = {}) =>
      addToast({
        type: 'warning',
        title: 'Warning',
        message,
        ...options,
      }),
    info: (message: string, options: Partial<ToastProps> = {}) =>
      addToast({
        type: 'info',
        title: 'Info',
        message,
        ...options,
      }),
    custom: (toast: ToastProps) => addToast(toast),
  }

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer: React.FC<{
  toasts: ToastProps[]
  onRemove: (id: string | number) => void
}> = ({ toasts, onRemove }) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  )
}

const Toast: React.FC<{
  toast: ToastProps
  onRemove: (id: string | number) => void
}> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (toast.id) onRemove(toast.id)
    }, 300)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return null
    }
  }

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-white border-gray-200 text-gray-800'
    }
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 transform',
        getStyles(),
        isVisible
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="font-semibold text-sm mb-1">{toast.title}</div>
          )}
          <div className="text-sm">{toast.message}</div>
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default ToastProvider
