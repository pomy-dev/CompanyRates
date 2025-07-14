// Notification utility for the rating app
// Contains pre-defined notification messages and configurations

export const NotificationMessages = {
  // User Details
  USER_DETAILS: {
    VALIDATION_ERROR: (fields) => ({
      type: 'error',
      title: 'Missing Information',
      message: `Please fill in your ${fields} to continue.`,
      duration: 5000
    }),
    PROFILE_SAVED: (username) => ({
      type: 'success',
      title: 'Profile Saved',
      message: `Welcome ${username}! Your details have been saved.`,
      duration: 4000
    }),
    SMS_SENT: (phoneNumber) => ({
      type: 'info',
      title: 'SMS Sent',
      message: `A rating link has been sent to ${phoneNumber}. Please check your messages.`,
      duration: 6000
    }),
    PHONE_VALIDATION: {
      type: 'error',
      title: 'Invalid Phone Number',
      message: 'Please enter a valid phone number.',
      duration: 4000
    },
    EMAIL_VALIDATION: {
      type: 'error',
      title: 'Invalid Email',
      message: 'Please enter a valid email address.',
      duration: 4000
    }
  },

  // Service Point
  SERVICE_POINT: {
    SELECTION_REQUIRED: {
      type: 'warning',
      title: 'Service Point Required',
      message: 'Please select a service point to continue.',
      duration: 4000
    },
    SELECTED: (serviceName) => ({
      type: 'success',
      title: 'Service Point Selected',
      message: `You selected: ${serviceName}`,
      duration: 3000
    })
  },

  // Rating
  RATING: {
    SUBMITTED: {
      type: 'success',
      title: 'Rating Submitted',
      message: 'Thank you for your feedback! Your rating has been recorded.',
      duration: 6000
    },
    VALIDATION_ERROR: {
      type: 'error',
      title: 'Rating Required',
      message: 'Please provide ratings for all criteria.',
      duration: 4000
    },
    SUBMIT_ERROR: {
      type: 'error',
      title: 'Submission Failed',
      message: 'Failed to submit your rating. Please try again.',
      duration: 6000
    },
    LOADING: {
      type: 'info',
      title: 'Submitting Rating',
      message: 'Please wait while we save your feedback...',
      duration: 0, // Won't auto-dismiss
      closable: false
    }
  },

  // Feedback
  FEEDBACK: {
    SUBMITTED: {
      type: 'success',
      title: 'Feedback Submitted',
      message: 'Thank you for your valuable feedback!',
      duration: 5000
    },
    SUBMIT_ERROR: {
      type: 'error',
      title: 'Submission Failed',
      message: 'Failed to submit your feedback. Please try again.',
      duration: 6000
    },
    THANK_YOU: {
      type: 'success',
      title: 'Thank You!',
      message: 'Your feedback helps us improve our service.',
      duration: 4000
    }
  },

  // General App
  GENERAL: {
    NETWORK_ERROR: {
      type: 'error',
      title: 'Network Error',
      message: 'Please check your internet connection and try again.',
      duration: 7000
    },
    UNEXPECTED_ERROR: {
      type: 'error',
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      duration: 6000
    },
    LOADING: {
      type: 'info',
      title: 'Loading',
      message: 'Please wait...',
      duration: 0,
      closable: false
    },
    SUCCESS: (message) => ({
      type: 'success',
      title: 'Success',
      message,
      duration: 4000
    }),
    INFO: (message) => ({
      type: 'info',
      title: 'Info',
      message,
      duration: 4000
    }),
    WARNING: (message) => ({
      type: 'warning',
      title: 'Warning',
      message,
      duration: 5000
    }),
    ERROR: (message) => ({
      type: 'error',
      title: 'Error',
      message,
      duration: 6000
    })
  },

  // Admin
  ADMIN: {
    LOGIN_SUCCESS: {
      type: 'success',
      title: 'Login Successful',
      message: 'Welcome to the admin dashboard!',
      duration: 3000
    },
    LOGIN_ERROR: {
      type: 'error',
      title: 'Login Failed',
      message: 'Invalid credentials. Please try again.',
      duration: 5000
    },
    LOGOUT_SUCCESS: {
      type: 'info',
      title: 'Logged Out',
      message: 'You have been logged out successfully.',
      duration: 3000
    },
    UNAUTHORIZED: {
      type: 'error',
      title: 'Unauthorized',
      message: 'You do not have permission to access this resource.',
      duration: 6000
    }
  }
}

// Utility functions for common notification patterns
export const NotificationUtils = {
  // Validation helpers
  validateAndNotify: (notification, field, value, validationFn) => {
    if (!validationFn(value)) {
      notification.error(NotificationMessages.USER_DETAILS.VALIDATION_ERROR(field))
      return false
    }
    return true
  },

  // Phone number validation
  validatePhoneNumber: (phoneNumber) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''))
  },

  // Email validation
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Format phone number for display
  formatPhoneNumber: (phoneNumber) => {
    return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  },

  // Show loading notification and return dismiss function
  showLoadingNotification: (notification, message = 'Loading...') => {
    const loadingNotification = {
      ...NotificationMessages.GENERAL.LOADING,
      message
    }
    const id = notification.custom(loadingNotification)
    return () => notification.removeNotification(id)
  },

  // Show success notification with auto-dismiss
  showSuccessWithCallback: (notification, message, callback, delay = 2000) => {
    notification.success(message)
    setTimeout(callback, delay)
  },

  // Show error with retry action
  showErrorWithRetry: (notification, message, retryFn) => {
    notification.custom({
      type: 'error',
      title: 'Error',
      message,
      duration: 0,
      action: (
        <button
          onClick={retryFn}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      )
    })
  }
}

// Notification positions
export const NotificationPositions = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center'
}

// Default notification configuration
export const DefaultNotificationConfig = {
  duration: 5000,
  position: NotificationPositions.TOP_RIGHT,
  showProgress: true,
  closable: true
}

export default {
  NotificationMessages,
  NotificationUtils,
  NotificationPositions,
  DefaultNotificationConfig
}
