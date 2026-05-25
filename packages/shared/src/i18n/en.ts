export const en = {
  appName: 'Panisewa',
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    loading: 'Loading...',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
  },
  errors: {
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'You do not have permission to perform this action',
    badRequest: 'Invalid request',
    serverError: 'Something went wrong. Please try again.',
    networkError: 'Network error. Check your connection.',
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset Password',
  },
  order: {
    status: {
      DRAFT: 'Draft',
      CONFIRMED: 'Confirmed',
      ASSIGNED: 'Assigned',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled',
    },
  },
} as const

export type I18nKeys = typeof en
