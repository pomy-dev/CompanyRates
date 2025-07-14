'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Phone, Mail, User, Clock, Send, Star, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      duration: 5000,
      position: 'top-right',
      showProgress: true,
      closable: true,
      ...notification
    }
    
    setNotifications((prev) => [...prev, newNotification])
    
    // Auto remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter(notification => notification.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const notification = {
    success: (message, options = {}) => addNotification({
      type: 'success',
      title: options.title || 'Success',
      message,
      icon: CheckCircle,
      ...options
    }),
    error: (message, options = {}) => addNotification({
      type: 'error',
      title: options.title || 'Error',
      message,
      icon: AlertCircle,
      duration: options.duration || 7000,
      ...options
    }),
    warning: (message, options = {}) => addNotification({
      type: 'warning',
      title: options.title || 'Warning',
      message,
      icon: AlertTriangle,
      ...options
    }),
    info: (message, options = {}) => addNotification({
      type: 'info',
      title: options.title || 'Info',
      message,
      icon: Info,
      ...options
    }),
    // App-specific notifications
    userSaved: (username, options = {}) => addNotification({
      type: 'success',
      title: 'Profile Saved',
      message: `Welcome ${username}! Your details have been saved.`,
      icon: User,
      duration: 4000,
      ...options
    }),
    validationError: (field, options = {}) => addNotification({
      type: 'error',
      title: 'Validation Error',
      message: `Please check your ${field} and try again.`,
      icon: AlertTriangle,
      duration: 5000,
      ...options
    }),
    ratingSubmitted: (options = {}) => addNotification({
      type: 'success',
      title: 'Rating Submitted',
      message: 'Thank you for your feedback! Your rating has been recorded.',
      icon: Star,
      duration: 6000,
      ...options
    }),
    smsSent: (phoneNumber, options = {}) => addNotification({
      type: 'info',
      title: 'SMS Sent',
      message: `Rating link sent to ${phoneNumber}. Please check your messages.`,
      icon: Phone,
      duration: 6000,
      ...options
    }),
    thankYou: (options = {}) => addNotification({
      type: 'success',
      title: 'Thank You!',
      message: 'Your feedback helps us improve our service.',
      icon: Heart,
      duration: 4000,
      ...options
    }),
    custom: (notification) => addNotification(notification)
  }

  return (
    <NotificationContext.Provider value={{ notification, removeNotification, clearAll }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

const NotificationContainer = ({ notifications, onRemove }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const position = notification.position || 'top-right'
    if (!acc[position]) {
      acc[position] = []
    }
    acc[position].push(notification)
    return acc
  }, {})

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-50">
      {Object.entries(groupedNotifications).map(([position, notificationList]) => (
        <div
          key={position}
          className={cn(
            "absolute flex flex-col gap-2 p-4 max-w-sm",
            {
              'top-4 right-4': position === 'top-right',
              'top-4 left-4': position === 'top-left',
              'bottom-4 right-4': position === 'bottom-right',
              'bottom-4 left-4': position === 'bottom-left',
              'top-4 left-1/2 transform -translate-x-1/2': position === 'top-center',
              'bottom-4 left-1/2 transform -translate-x-1/2': position === 'bottom-center',
            }
          )}
        >
          {notificationList.map((notification) => (
            <Notification key={notification.id} notification={notification} onRemove={onRemove} />
          ))}
        </div>
      ))}
    </div>,
    document.body
  )
}

const Notification = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    setIsVisible(true)
    
    // Progress bar animation
    if (notification.showProgress && notification.duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (notification.duration / 100))
          return newProgress <= 0 ? 0 : newProgress
        })
      }, 100)
      
      return () => clearInterval(interval)
    }
  }, [notification.duration, notification.showProgress])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(notification.id), 300)
  }

  const getIcon = () => {
    if (notification.icon) {
      const IconComponent = notification.icon
      return <IconComponent className="w-5 h-5" />
    }
    
    switch (notification.type) {
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
    switch (notification.type) {
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

  const getProgressColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'info':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border shadow-lg transition-all duration-300 transform pointer-events-auto",
        "hover:shadow-xl hover:scale-105",
        getStyles(),
        isVisible
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-full opacity-0 scale-95"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            {notification.title && (
              <div className="font-semibold text-sm mb-1">
                {notification.title}
              </div>
            )}
            <div className="text-sm leading-relaxed">
              {notification.message}
            </div>
            {notification.action && (
              <div className="mt-3">
                {notification.action}
              </div>
            )}
          </div>
          {notification.closable && (
            <button
              onClick={handleRemove}
              className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      {notification.showProgress && notification.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div
            className={cn("h-full transition-all duration-100 ease-linear", getProgressColor())}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default NotificationProvider
