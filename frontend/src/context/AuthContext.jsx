import { createContext, useState, useContext, useEffect } from 'react'
import { apiService } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await apiService.login({ email, password })
      
      if (response.status === 'success') {
        const userData = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        }
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', response.data.token)
        return { success: true }
      }
      throw new Error(response.message || 'Login failed')
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData)
      
      if (response.status === 'success') {
        const user = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        }
        setUser(user)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', response.data.token)
        return { success: true }
      }
      throw new Error(response.message || 'Registration failed')
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
