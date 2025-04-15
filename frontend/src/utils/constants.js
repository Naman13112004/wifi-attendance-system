export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const ROUTES = {
  HOME: '/',
  STUDENT_LOGIN: '/student/login',
  STUDENT_SIGNUP: '/student/signup',
  STUDENT_DASHBOARD: '/student/dashboard',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_SIGNUP: '/admin/signup',
  ADMIN_DASHBOARD: '/admin/dashboard'
}

export const AUTH_TOKEN_KEY = 'attendance-system-token'
export const USER_TYPE_KEY = 'attendance-system-user-type'