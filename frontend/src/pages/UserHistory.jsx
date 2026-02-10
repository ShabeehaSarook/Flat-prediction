import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiService } from '../services/api'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'

const UserHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiService.getPredictionHistory()
      setPredictions(response.data)
    } catch (err) {
      setError('Failed to load prediction history')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this prediction?')) return
    
    try {
      await apiService.deletePrediction(id)
      setPredictions(predictions.filter(p => p._id !== id))
    } catch (err) {
      alert('Failed to delete prediction')
    }
  }

  const sortedPredictions = [...predictions].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    } else if (sortBy === 'price-high') {
      return b.predictedPrice - a.predictedPrice
    } else if (sortBy === 'price-low') {
      return a.predictedPrice - b.predictedPrice
    }
    return 0
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price)
  }

  const stats = {
    total: predictions.length,
    avgPrice: predictions.length > 0 
      ? (predictions.reduce((sum, p) => sum + p.predictedPrice, 0) / predictions.length).toFixed(2)
      : 0,
    maxPrice: predictions.length > 0 
      ? Math.max(...predictions.map(p => p.predictedPrice))
      : 0,
    minPrice: predictions.length > 0 
      ? Math.min(...predictions.map(p => p.predictedPrice))
      : 0
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-top">
          <div className="header-left">
            <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <div>
              <h1>My Predictions</h1>
              <p>Your prediction history and insights</p>
            </div>
          </div>
          <button onClick={() => navigate('/home')} className="btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon predictions">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Predictions</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon price">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{(stats.avgPrice / 1000000).toFixed(2)}M</div>
              <div className="stat-label">Average Price</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon activity">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{(stats.maxPrice / 1000000).toFixed(2)}M</div>
              <div className="stat-label">Highest Price</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon users">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{(stats.minPrice / 1000000).toFixed(2)}M</div>
              <div className="stat-label">Lowest Price</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-header">
          <h2>Prediction History</h2>
          <div className="sort-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="price-high">Price (High to Low)</option>
              <option value="price-low">Price (Low to High)</option>
            </select>
          </div>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading your predictions...</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>No predictions yet</h3>
            <p>Start making predictions to see your history here</p>
            <button onClick={() => navigate('/home')} className="btn-primary">
              Make a Prediction
            </button>
          </div>
        ) : (
          <div className="predictions-grid">
            {sortedPredictions.map((prediction) => (
              <div key={prediction._id} className="prediction-card">
                <div className="prediction-header">
                  <div className="prediction-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {formatDate(prediction.createdAt)}
                  </div>
                  <button 
                    className="btn-delete-icon"
                    onClick={() => handleDelete(prediction._id)}
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>

                <div className="prediction-price-main">
                  {formatPrice(prediction.predictedPrice)}
                </div>
                <div className="prediction-price-sub">
                  {prediction.priceInMillions?.toFixed(2)} Million RUB
                </div>

                <div className="prediction-details">
                  <div className="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>
                    <span>{prediction.propertyData?.total_area} m²</span>
                  </div>
                  <div className="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    </svg>
                    <span>{prediction.propertyData?.rooms_count} rooms</span>
                  </div>
                  <div className="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{prediction.propertyData?.district_name}</span>
                  </div>
                  <div className="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                    </svg>
                    <span>Floor {prediction.propertyData?.floor} of {prediction.propertyData?.floor_max}</span>
                  </div>
                  <div className="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Built in {prediction.propertyData?.year}</span>
                  </div>
                  <div className="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 20V10M12 20V4M6 20v-6"/>
                    </svg>
                    <span>{prediction.propertyData?.ceil_height}m ceiling</span>
                  </div>
                </div>

                <div className="prediction-amenities">
                  {prediction.propertyData?.gas === 'Yes' && (
                    <span className="amenity-tag">🔥 Gas</span>
                  )}
                  {prediction.propertyData?.hot_water === 'Yes' && (
                    <span className="amenity-tag">💧 Hot Water</span>
                  )}
                  {prediction.propertyData?.central_heating === 'Yes' && (
                    <span className="amenity-tag">♨️ Heating</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserHistory
