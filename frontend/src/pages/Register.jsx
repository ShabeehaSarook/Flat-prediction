import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Auth.css'

const Register = () => {
  const navigate = useNavigate()
  const { register, user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
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
  const validateName = (name) => {
    if (!name.trim()) return 'Name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    if (name.trim().length > 50) return 'Name must be less than 50 characters'
    return ''
  }

  const validateEmail = (email) => {
    if (!email) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return ''
  }

  const validatePassword = (password) => {
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    if (password.length > 100) return 'Password must be less than 100 characters'
    if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
    return ''
  }

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Please confirm your password'
    if (confirmPassword !== password) return 'Passwords do not match'
    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
    setError('')
    setSuccess('')
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    let error = ''

    switch (name) {
      case 'name':
        error = validateName(value)
        break
      case 'email':
        error = validateEmail(value)
        break
      case 'password':
        error = validatePassword(value)
        // Also revalidate confirm password if it's filled
        if (formData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: validateConfirmPassword(formData.confirmPassword, value)
          }))
        }
        break
      case 'confirmPassword':
        error = validateConfirmPassword(value, formData.password)
        break
      default:
        break
    }

    setErrors({ ...errors, [name]: error })
  }

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password)
    }

    setErrors(newErrors)

    // Return true if no errors
    return !Object.values(newErrors).some(error => error !== '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate all fields
    if (!validateForm()) {
      setError('Please fix the errors below')
      return
    }

    setLoading(true)

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      })
      
      // Show success message
      const roleText = formData.role === 'admin' ? 'Admin' : 'User'
      setSuccess(`✓ Account created successfully as ${roleText}! Redirecting...`)
      
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
      }, 1500)
      
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.')
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
          <h1>Create Account</h1>
          <p>Join us to start predicting property prices</p>
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
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your full name"
              className={errors.name ? 'error' : ''}
              autoComplete="name"
              disabled={loading}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

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
              placeholder="Create a password (min 6 characters)"
              className={errors.password ? 'error' : ''}
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
            {!errors.password && formData.password && (
              <span className="helper-text">
                Password strength: {formData.password.length >= 8 ? '✓ Strong' : formData.password.length >= 6 ? '⚠ Medium' : '✗ Weak'}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Re-enter your password"
              className={errors.confirmPassword ? 'error' : ''}
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            {!errors.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password && (
              <span className="success-message">✓ Passwords match</span>
            )}
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <select name="role" value={formData.role} onChange={handleChange} disabled={loading}>
              <option value="user">Regular User (Predictions only)</option>
              <option value="admin">Administrator (Full access)</option>
            </select>
            <span className="helper-text">
              {formData.role === 'admin' 
                ? '🔑 Admin can manage users and view all predictions' 
                : '👤 User can make predictions and view own history'}
            </span>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Register
