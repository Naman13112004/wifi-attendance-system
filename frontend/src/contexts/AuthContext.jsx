import { createContext, useContext, useEffect, useState } from 'react'
import jwtDecode from 'jwt-decode'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const userType = localStorage.getItem('userType')
      
      if (token) {
        try {
          const decoded = jwtDecode(token)
          
          // Verify token expiration
          if (decoded.exp * 1000 < Date.now()) {
            logout()
            return
          }
          
          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Fetch user data based on type
          let userData
          if (userType === 'student') {
            const response = await api.get(`/student/profile`)
            userData = response.data
          } else if (userType === 'admin') {
            const response = await api.get(`/admin/profile`)
            userData = response.data
          }
          
          setUser({ ...userData, role: userType })
        } catch (error) {
          console.error('Auth error:', error)
          logout()
        }
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const login = async (credentials, userType) => {
    try {
      const endpoint = userType === 'student' ? '/user/signin' : '/admin/signin'
      const response = await api.post(endpoint, credentials)
      
      const { token } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('userType', userType)
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Fetch user data
      const userResponse = userType === 'student' 
        ? await api.get('/user/profile') 
        : await api.get('/admin/profile')
      
      setUser({ ...userResponse.data, role: userType })
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const register = async (credentials, userType) => {
    try {
      const endpoint = userType === 'student' ? '/user/signup' : '/admin/signup'
      await api.post(endpoint, credentials)
      
      // Automatically login after successful registration
      return await login({
        email: credentials.email,
        password: credentials.password
      }, userType)
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)