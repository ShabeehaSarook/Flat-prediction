import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiService } from '../services/api'
import { validatePredictionForm, validateField, hasErrors, getErrorSummary } from '../utils/validationRules'
import '../styles/Home.css'

const Home = () => {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    total_area: '',
    kitchen_area: '',
    bath_area: '',
    other_area: '',
    extra_area: '',
    extra_area_count: '',
    year: '',
    ceil_height: '',
    floor: '',
    floor_max: '',
    rooms_count: '',
    bath_count: '',
    gas: 'Yes',
    hot_water: 'Yes',
    central_heating: 'Yes',
    extra_area_type_name: 'balkon',
    district_name: 'Centralnyj'
  })

  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      await apiService.checkHealth()
      await apiService.checkFlaskHealth()
      setBackendStatus('connected')
    } catch (err) {
      setBackendStatus('disconnected')
      setError('Backend server is not responding. Please start the servers.')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear general error
    if (error) setError('')
    
    // Real-time validation for this field
    const fieldError = validateField(name, value, { ...formData, [name]: value })
    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldError
    }))
  }

  const loadExample = async () => {
    try {
      const response = await apiService.getExampleProperty()
      if (response.example) {
        setFormData(response.example)
        setError('')
        setPrediction(null)
      }
    } catch (err) {
      setError('Failed to load example data')
    }
  }

  const resetForm = () => {
    setFormData({
      total_area: '',
      kitchen_area: '',
      bath_area: '',
      other_area: '',
      extra_area: '',
      extra_area_count: '',
      year: '',
      ceil_height: '',
      floor: '',
      floor_max: '',
      rooms_count: '',
      bath_count: '',
      gas: 'Yes',
      hot_water: 'Yes',
      central_heating: 'Yes',
      extra_area_type_name: 'balkon',
      district_name: 'Centralnyj'
    })
    setPrediction(null)
    setError('')
    setFieldErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPrediction(null)
    
    // Validate form before submission (UI-04, PRED-01 to PRED-12)
    const validationErrors = validatePredictionForm(formData)
    
    if (hasErrors(validationErrors)) {
      setFieldErrors(validationErrors)
      setError(getErrorSummary(validationErrors))
      
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0]
      const element = document.getElementsByName(firstErrorField)[0]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
      
      return
    }
    
    setLoading(true)

    try {
      const processedData = {
        kitchen_area: parseFloat(formData.kitchen_area),
        bath_area: formData.bath_area ? parseFloat(formData.bath_area) : 0,
        other_area: formData.other_area ? parseFloat(formData.other_area) : 0,
        extra_area: formData.extra_area ? parseFloat(formData.extra_area) : 0,
        extra_area_count: parseInt(formData.extra_area_count),
        year: parseInt(formData.year),
        ceil_height: parseFloat(formData.ceil_height),
        floor_max: parseInt(formData.floor_max),
        floor: parseInt(formData.floor),
        total_area: parseFloat(formData.total_area),
        bath_count: parseInt(formData.bath_count),
        rooms_count: parseInt(formData.rooms_count),
        gas: formData.gas,
        hot_water: formData.hot_water,
        central_heating: formData.central_heating,
        extra_area_type_name: formData.extra_area_type_name,
        district_name: formData.district_name
      }

      const response = await apiService.predictPrice(processedData)
      setPrediction(response.data)
      setFieldErrors({}) // Clear all field errors on success
    } catch (err) {
      console.error('Prediction error:', err)
      setError(err.response?.data?.message || 'Failed to get prediction. Please check all fields and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div className="header-content">
          <div className="header-title">
            <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <div>
              <h1>Real Estate Price Prediction</h1>
              <p>Enter property details to get an instant price estimate</p>
            </div>
          </div>
          <div className={`status-badge ${backendStatus}`}>
            <span className="status-dot"></span>
            <span>{backendStatus === 'connected' ? 'Connected' : backendStatus === 'checking' ? 'Checking...' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="home-main">
        <div className="form-container">
          <div className="form-header">
            <h2>Property Details</h2>
            <div className="button-group">
              <button type="button" onClick={loadExample} className="btn-secondary">
                📥 Load Example
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                🔄 Reset
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="prediction-form">
            {/* Area Information */}
            <div className="form-section">
              <h3 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                </svg>
                Area Information (m²)
              </h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Total Area * <span style={{fontSize: '0.85em', color: '#666'}}>(10-500 m²)</span></label>
                  <input
                    type="number"
                    name="total_area"
                    value={formData.total_area}
                    onChange={handleInputChange}
                    placeholder="e.g., 65"
                    step="0.1"
                    min="10"
                    max="500"
                    required
                    className={fieldErrors.total_area ? 'error' : ''}
                  />
                  {fieldErrors.total_area && <span className="error-text">{fieldErrors.total_area}</span>}
                </div>
                <div className="form-field">
                  <label>Kitchen Area * <span style={{fontSize: '0.85em', color: '#666'}}>(0-100 m²)</span></label>
                  <input
                    type="number"
                    name="kitchen_area"
                    value={formData.kitchen_area}
                    onChange={handleInputChange}
                    placeholder="e.g., 12"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    className={fieldErrors.kitchen_area ? 'error' : ''}
                  />
                  {fieldErrors.kitchen_area && <span className="error-text">{fieldErrors.kitchen_area}</span>}
                </div>
                <div className="form-field">
                  <label>Bathroom Area <span style={{fontSize: '0.85em', color: '#666'}}>(0-50 m²)</span></label>
                  <input
                    type="number"
                    name="bath_area"
                    value={formData.bath_area}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    step="0.1"
                    min="0"
                    max="50"
                    className={fieldErrors.bath_area ? 'error' : ''}
                  />
                  {fieldErrors.bath_area && <span className="error-text">{fieldErrors.bath_area}</span>}
                </div>
                <div className="form-field">
                  <label>Other Area <span style={{fontSize: '0.85em', color: '#666'}}>(0-200 m²)</span></label>
                  <input
                    type="number"
                    name="other_area"
                    value={formData.other_area}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    step="0.1"
                    min="0"
                    max="200"
                    className={fieldErrors.other_area ? 'error' : ''}
                  />
                  {fieldErrors.other_area && <span className="error-text">{fieldErrors.other_area}</span>}
                </div>
                <div className="form-field">
                  <label>Extra Area (Balcony) <span style={{fontSize: '0.85em', color: '#666'}}>(0-50 m²)</span></label>
                  <input
                    type="number"
                    name="extra_area"
                    value={formData.extra_area}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    step="0.1"
                    min="0"
                    max="50"
                    className={fieldErrors.extra_area ? 'error' : ''}
                  />
                  {fieldErrors.extra_area && <span className="error-text">{fieldErrors.extra_area}</span>}
                </div>
                <div className="form-field">
                  <label>Extra Area Count * <span style={{fontSize: '0.85em', color: '#666'}}>(0-10)</span></label>
                  <input
                    type="number"
                    name="extra_area_count"
                    value={formData.extra_area_count}
                    onChange={handleInputChange}
                    placeholder="e.g., 1"
                    min="0"
                    max="10"
                    required
                    className={fieldErrors.extra_area_count ? 'error' : ''}
                  />
                  {fieldErrors.extra_area_count && <span className="error-text">{fieldErrors.extra_area_count}</span>}
                </div>
              </div>
            </div>

            {/* Building Information */}
            <div className="form-section">
              <h3 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                Building Information
              </h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Construction Year * <span style={{fontSize: '0.85em', color: '#666'}}>(1900-2030)</span></label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="e.g., 2015"
                    min="1900"
                    max="2030"
                    required
                    className={fieldErrors.year ? 'error' : ''}
                  />
                  {fieldErrors.year && <span className="error-text">{fieldErrors.year}</span>}
                </div>
                <div className="form-field">
                  <label>Ceiling Height (m) * <span style={{fontSize: '0.85em', color: '#666'}}>(2.0-5.0)</span></label>
                  <input
                    type="number"
                    name="ceil_height"
                    value={formData.ceil_height}
                    onChange={handleInputChange}
                    placeholder="e.g., 2.7"
                    step="0.1"
                    min="2.0"
                    max="5.0"
                    required
                    className={fieldErrors.ceil_height ? 'error' : ''}
                  />
                  {fieldErrors.ceil_height && <span className="error-text">{fieldErrors.ceil_height}</span>}
                </div>
                <div className="form-field">
                  <label>Floor Number * <span style={{fontSize: '0.85em', color: '#666'}}>(1-100)</span></label>
                  <input
                    type="number"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    min="1"
                    max="100"
                    required
                    className={fieldErrors.floor ? 'error' : ''}
                  />
                  {fieldErrors.floor && <span className="error-text">{fieldErrors.floor}</span>}
                </div>
                <div className="form-field">
                  <label>Maximum Floor * <span style={{fontSize: '0.85em', color: '#666'}}>(1-100)</span></label>
                  <input
                    type="number"
                    name="floor_max"
                    value={formData.floor_max}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                    min="1"
                    max="100"
                    required
                    className={fieldErrors.floor_max ? 'error' : ''}
                  />
                  {fieldErrors.floor_max && <span className="error-text">{fieldErrors.floor_max}</span>}
                </div>
                <div className="form-field">
                  <label>Number of Rooms * <span style={{fontSize: '0.85em', color: '#666'}}>(0-20)</span></label>
                  <input
                    type="number"
                    name="rooms_count"
                    value={formData.rooms_count}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    min="0"
                    max="20"
                    required
                    className={fieldErrors.rooms_count ? 'error' : ''}
                  />
                  {fieldErrors.rooms_count && <span className="error-text">{fieldErrors.rooms_count}</span>}
                </div>
                <div className="form-field">
                  <label>Number of Bathrooms * <span style={{fontSize: '0.85em', color: '#666'}}>(0-10)</span></label>
                  <input
                    type="number"
                    name="bath_count"
                    value={formData.bath_count}
                    onChange={handleInputChange}
                    placeholder="e.g., 1"
                    min="0"
                    max="10"
                    required
                    className={fieldErrors.bath_count ? 'error' : ''}
                  />
                  {fieldErrors.bath_count && <span className="error-text">{fieldErrors.bath_count}</span>}
                </div>
              </div>
            </div>

            {/* Amenities & Location */}
            <div className="form-section">
              <h3 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                Amenities & Location
              </h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Gas Supply *</label>
                  <select name="gas" value={formData.gas} onChange={handleInputChange} required className={fieldErrors.gas ? 'error' : ''}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {fieldErrors.gas && <span className="error-text">{fieldErrors.gas}</span>}
                </div>
                <div className="form-field">
                  <label>Hot Water *</label>
                  <select name="hot_water" value={formData.hot_water} onChange={handleInputChange} required className={fieldErrors.hot_water ? 'error' : ''}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {fieldErrors.hot_water && <span className="error-text">{fieldErrors.hot_water}</span>}
                </div>
                <div className="form-field">
                  <label>Central Heating *</label>
                  <select name="central_heating" value={formData.central_heating} onChange={handleInputChange} required className={fieldErrors.central_heating ? 'error' : ''}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {fieldErrors.central_heating && <span className="error-text">{fieldErrors.central_heating}</span>}
                </div>
                <div className="form-field">
                  <label>Extra Area Type *</label>
                  <select name="extra_area_type_name" value={formData.extra_area_type_name} onChange={handleInputChange} required className={fieldErrors.extra_area_type_name ? 'error' : ''}>
                    <option value="balkon">Balcony</option>
                    <option value="lodzhija">Loggia</option>
                    <option value="net">None</option>
                  </select>
                  {fieldErrors.extra_area_type_name && <span className="error-text">{fieldErrors.extra_area_type_name}</span>}
                </div>
                <div className="form-field form-field-full">
                  <label>District *</label>
                  <select name="district_name" value={formData.district_name} onChange={handleInputChange} required className={fieldErrors.district_name ? 'error' : ''}>
                    <option value="Centralnyj">Centralnyj (Central)</option>
                    <option value="Leninskij">Leninskij (Lenin)</option>
                    <option value="Oktyabrskij">Oktyabrskij (October)</option>
                    <option value="Sovetskij">Sovetskij (Soviet)</option>
                    <option value="Zheleznodorozhnyj">Zheleznodorozhnyj (Railway)</option>
                    <option value="Industrialnyj">Industrialnyj (Industrial)</option>
                  </select>
                  {fieldErrors.district_name && <span className="error-text">{fieldErrors.district_name}</span>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || backendStatus !== 'connected'}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Calculating...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Get Price Prediction
                </>
              )}
            </button>
          </form>

          {/* Results */}
          {prediction && (
            <div className="result-container">
              <div className="result-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <h3>Predicted Price</h3>
              </div>
              <div className="result-price">{prediction.priceFormatted}</div>
              <div className="result-details">
                <div className="detail-item">
                  <span className="detail-label">Price (Millions)</span>
                  <span className="detail-value">{prediction.priceInMillions} M RUB</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Currency</span>
                  <span className="detail-value">{prediction.currency}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Predicted By</span>
                  <span className="detail-value">{user?.name || 'User'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
