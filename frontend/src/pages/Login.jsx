import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    }
  }, [user, navigate])

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return ''
  }

  const validatePassword = (password) => {
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
    setError('')
    setSuccess('')
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    let error = ''

    if (name === 'email') {
      error = validateEmail(value)
    } else if (name === 'password') {
      error = validatePassword(value)
    }

    setErrors({ ...errors, [name]: error })
  }

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password)
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setError('Please fix the errors below')
      return
    }

    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      // Show success message
      setSuccess('✓ Login successful! Redirecting...')
      
      // Wait a moment to show success message
      setTimeout(() => {
        // Get user data from localStorage to check role
        const userData = JSON.parse(localStorage.getItem('user'))
        
        // Redirect based on user role
        if (userData && userData.role === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/home')
        }
      }, 1000)
      
    } catch (err) {
      console.error('Login error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  const handleQuickLogin = async (email, password, redirectPath, accountType) => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      await login(email, password)
      setSuccess(`✓ Logged in as ${accountType}! Redirecting...`)
      
      setTimeout(() => {
        navigate(redirectPath)
      }, 1000)
      
    } catch (err) {
      setError(`Quick login failed. Please try manual login.`)
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to predict property prices</p>
        </div>

        {error && (
          <div className="alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
              autoComplete="email"
              disabled={loading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
              autoComplete="current-password"
              disabled={loading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>

        <div className="quick-login">
          <p className="quick-login-title">Quick Login for Testing:</p>
          <div className="quick-login-info">
            <p style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem'}}>
              Use these test accounts to access different roles
            </p>
          </div>
          <div className="quick-login-buttons">
            <button 
              type="button" 
              className="quick-btn quick-btn-admin"
              onClick={() => handleQuickLogin('admin@example.com', 'admin123', '/admin/dashboard', 'Admin')}
              disabled={loading}
            >
              <span>🔑</span>
              <div>
                <strong>Admin Account</strong>
                <small>Full access to all features</small>
              </div>
            </button>
            <button 
              type="button" 
              className="quick-btn quick-btn-user"
              onClick={() => handleQuickLogin('user@example.com', 'user123', '/home', 'User')}
              disabled={loading}
            >
              <span>👤</span>
              <div>
                <strong>User Account</strong>
                <small>Standard user access</small>
              </div>
            </button>
          </div>
          <div className="quick-login-credentials">
            <details>
              <summary>Show credentials</summary>
              <div className="credentials-list">
                <div className="credential-item">
                  <strong>Admin:</strong>
                  <code>admin@example.com</code> / <code>admin123</code>
                </div>
                <div className="credential-item">
                  <strong>User:</strong>
                  <code>user@example.com</code> / <code>user123</code>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
