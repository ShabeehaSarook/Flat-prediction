import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiService } from '../services/api'
import '../styles/AdminPanel.css'

const AdminPanel = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Dashboard state
  const [stats, setStats] = useState(null)
  const [recentPredictions, setRecentPredictions] = useState([])
  
  // Users state
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  
  // Predictions state
  const [predictions, setPredictions] = useState([])
  const [filteredPredictions, setFilteredPredictions] = useState([])
  const [predictionSearchTerm, setPredictionSearchTerm] = useState('')
  const [selectedPredictions, setSelectedPredictions] = useState([])
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showEditPredictionModal, setShowEditPredictionModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedPrediction, setSelectedPrediction] = useState(null)

  // Pagination state
  const [currentUserPage, setCurrentUserPage] = useState(1)
  const [currentPredictionPage, setCurrentPredictionPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    // Only redirect non-admin users once when user state is loaded
    if (user && user.role !== 'admin') {
      navigate('/home', { replace: true })
      return
    }
    
    // Load data only if user is admin
    if (user?.role === 'admin') {
      loadAllData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]) // Only depend on role, not entire user object

  // Separate effect for URL-based tab switching
  useEffect(() => {
    if (location.pathname.includes('/users')) {
      setActiveTab('users')
    } else if (location.pathname.includes('/predictions')) {
      setActiveTab('predictions')
    } else if (location.pathname.includes('/admin')) {
      setActiveTab('dashboard')
    }
  }, [location.pathname])

  const loadAllData = async () => {
    setLoading(true)
    setError('')
    try {
      await Promise.all([
        loadDashboardData(),
        loadUsers(),
        loadPredictions()
      ])
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      const statsResponse = await apiService.getPredictionStats()
      const statsData = statsResponse.data
      // Transform backend data to match our component expectations
      setStats({
        totalPredictions: statsData.totalPredictions,
        totalUsers: statsData.uniqueUsers,
        averagePrice: statsData.priceStatistics.average,
        recentActivity: statsData.predictionsLast7Days
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await apiService.getAllUsers()
      setUsers(response.data)
      setFilteredUsers(response.data)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  const loadPredictions = async () => {
    try {
      const response = await apiService.getAllPredictions()
      setPredictions(response.data)
      setFilteredPredictions(response.data)
      setRecentPredictions(response.data.slice(0, 10))
    } catch (err) {
      console.error('Failed to load predictions:', err)
    }
  }

  // User filtering
  useEffect(() => {
    let filtered = users
    
    if (userSearchTerm) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      )
    }
    
    if (userRoleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === userRoleFilter)
    }
    
    setFilteredUsers(filtered)
    setCurrentUserPage(1)
  }, [userSearchTerm, userRoleFilter, users])

  // Prediction filtering
  useEffect(() => {
    let filtered = predictions
    
    if (predictionSearchTerm) {
      filtered = filtered.filter(p =>
        p.user?.name?.toLowerCase().includes(predictionSearchTerm.toLowerCase()) ||
        p.propertyData?.district_name?.toLowerCase().includes(predictionSearchTerm.toLowerCase())
      )
    }
    
    setFilteredPredictions(filtered)
    setCurrentPredictionPage(1)
  }, [predictionSearchTerm, predictions])

  // User CRUD operations
  const handleAddUser = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role')
    }

    try {
      await apiService.register(userData)
      await loadUsers()
      setShowAddUserModal(false)
      alert('User added successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add user')
    }
  }

  const handleUpdateUserRole = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newRole = formData.get('role')

    try {
      await apiService.updateUserRole(selectedUser._id, newRole)
      await loadUsers()
      setShowEditUserModal(false)
      setSelectedUser(null)
      alert('User role updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      await apiService.deleteUser(userId)
      await loadUsers()
      alert('User deleted successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  }

  // Prediction CRUD operations
  const handleUpdatePrediction = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Update the property data structure
    const updatedPropertyData = {
      ...selectedPrediction.propertyData,
      total_area: parseFloat(formData.get('totalArea')),
      kitchen_area: parseFloat(formData.get('kitchenArea')),
      floor: parseInt(formData.get('floor')),
      floor_max: parseInt(formData.get('numberOfFloors')),
      rooms_count: parseInt(formData.get('numberOfRooms')),
      district_name: formData.get('district')
    }

    const updatedData = {
      propertyData: updatedPropertyData,
      predictedPrice: parseFloat(formData.get('predictedPrice'))
    }

    try {
      await apiService.updatePrediction(selectedPrediction._id, updatedData)
      await loadPredictions()
      setShowEditPredictionModal(false)
      setSelectedPrediction(null)
      alert('Prediction updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update prediction')
    }
  }

  const handleDeletePrediction = async (predictionId) => {
    if (!window.confirm('Are you sure you want to delete this prediction?')) return

    try {
      await apiService.deletePrediction(predictionId)
      await loadPredictions()
      alert('Prediction deleted successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete prediction')
    }
  }

  const handleDeleteMultiplePredictions = async () => {
    if (selectedPredictions.length === 0) {
      alert('Please select predictions to delete')
      return
    }

    if (!window.confirm(`Delete ${selectedPredictions.length} prediction(s)?`)) return

    try {
      await apiService.deleteMultiplePredictions(selectedPredictions)
      await loadPredictions()
      setSelectedPredictions([])
      alert('Predictions deleted successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete predictions')
    }
  }

  const togglePredictionSelection = (id) => {
    setSelectedPredictions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const toggleAllPredictions = () => {
    if (selectedPredictions.length === paginatedPredictions.length) {
      setSelectedPredictions([])
    } else {
      setSelectedPredictions(paginatedPredictions.map(p => p._id))
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['User', 'District', 'Total Area', 'Kitchen Area', 'Floor', 'Total Floors', 'Rooms', 'Predicted Price', 'Date']
    const rows = filteredPredictions.map(p => [
      p.user?.name || 'N/A',
      p.propertyData?.district_name || 'N/A',
      p.propertyData?.total_area || 'N/A',
      p.propertyData?.kitchen_area || 'N/A',
      p.propertyData?.floor || 'N/A',
      p.propertyData?.floor_max || 'N/A',
      p.propertyData?.rooms_count || 'N/A',
      p.predictedPrice || 'N/A',
      new Date(p.createdAt).toLocaleDateString()
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `predictions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Formatting helpers
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Pagination
  const paginatedUsers = filteredUsers.slice(
    (currentUserPage - 1) * itemsPerPage,
    currentUserPage * itemsPerPage
  )

  const paginatedPredictions = filteredPredictions.slice(
    (currentPredictionPage - 1) * itemsPerPage,
    currentPredictionPage * itemsPerPage
  )

  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const totalPredictionPages = Math.ceil(filteredPredictions.length / itemsPerPage)

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading-spinner">Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/admin/dashboard')}
          >
            <span className="icon">📊</span>
            Dashboard
          </button>
          <button
            className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => navigate('/admin/users')}
          >
            <span className="icon">👥</span>
            Manage Users
          </button>
          <button
            className={`sidebar-link ${activeTab === 'predictions' ? 'active' : ''}`}
            onClick={() => navigate('/admin/predictions')}
          >
            <span className="icon">🏠</span>
            Manage Predictions
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {error && <div className="error-banner">{error}</div>}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="admin-content">
            <div className="content-header">
              <h1>Dashboard Overview</h1>
              <button className="btn-refresh" onClick={loadAllData}>🔄 Refresh</button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h3>Total Predictions</h3>
                  <p className="stat-value">{stats?.totalPredictions || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-value">{stats?.totalUsers || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>Average Price</h3>
                  <p className="stat-value">{formatPrice(stats?.averagePrice || 0)}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🕐</div>
                <div className="stat-info">
                  <h3>Recent Activity</h3>
                  <p className="stat-value">{stats?.recentActivity || 0}</p>
                  <small>Last 7 days</small>
                </div>
              </div>
            </div>

            {/* Recent Predictions Table */}
            <div className="recent-section">
              <h2>Recent Predictions</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>District</th>
                      <th>Area (m²)</th>
                      <th>Rooms</th>
                      <th>Predicted Price</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPredictions.map(prediction => (
                      <tr key={prediction._id}>
                        <td>{prediction.user?.name || 'N/A'}</td>
                        <td>{prediction.propertyData?.district_name || 'N/A'}</td>
                        <td>{prediction.propertyData?.total_area || 'N/A'}</td>
                        <td>{prediction.propertyData?.rooms_count || 'N/A'}</td>
                        <td>{formatPrice(prediction.predictedPrice)}</td>
                        <td>{formatDate(prediction.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-content">
            <div className="content-header">
              <h1>Manage Users</h1>
              <button className="btn-primary" onClick={() => setShowAddUserModal(true)}>
                ➕ Add User
              </button>
            </div>

            {/* Filters */}
            <div className="filters">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowEditUserModal(true)
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalUserPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentUserPage === 1}
                  onClick={() => setCurrentUserPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <span>Page {currentUserPage} of {totalUserPages}</span>
                <button
                  disabled={currentUserPage === totalUserPages}
                  onClick={() => setCurrentUserPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="admin-content">
            <div className="content-header">
              <h1>Manage Predictions</h1>
              <div className="header-actions">
                <button className="btn-export" onClick={exportToCSV}>
                  📥 Export CSV
                </button>
                {selectedPredictions.length > 0 && (
                  <button className="btn-delete" onClick={handleDeleteMultiplePredictions}>
                    🗑️ Delete Selected ({selectedPredictions.length})
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="filters">
              <input
                type="text"
                placeholder="Search by user or district..."
                value={predictionSearchTerm}
                onChange={(e) => setPredictionSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Predictions Table */}
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedPredictions.length === paginatedPredictions.length && paginatedPredictions.length > 0}
                        onChange={toggleAllPredictions}
                      />
                    </th>
                    <th>User</th>
                    <th>District</th>
                    <th>Total Area</th>
                    <th>Rooms</th>
                    <th>Floor</th>
                    <th>Predicted Price</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPredictions.map(prediction => (
                    <tr key={prediction._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPredictions.includes(prediction._id)}
                          onChange={() => togglePredictionSelection(prediction._id)}
                        />
                      </td>
                      <td>{prediction.user?.name || 'N/A'}</td>
                      <td>{prediction.propertyData?.district_name || 'N/A'}</td>
                      <td>{prediction.propertyData?.total_area || 'N/A'} m²</td>
                      <td>{prediction.propertyData?.rooms_count || 'N/A'}</td>
                      <td>{prediction.propertyData?.floor || 'N/A'}/{prediction.propertyData?.floor_max || 'N/A'}</td>
                      <td>{formatPrice(prediction.predictedPrice)}</td>
                      <td>{formatDate(prediction.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => {
                              setSelectedPrediction(prediction)
                              setShowEditPredictionModal(true)
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeletePrediction(prediction._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPredictionPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPredictionPage === 1}
                  onClick={() => setCurrentPredictionPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <span>Page {currentPredictionPage} of {totalPredictionPages}</span>
                <button
                  disabled={currentPredictionPage === totalPredictionPages}
                  onClick={() => setCurrentPredictionPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password" required minLength="6" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" required>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User Role</h2>
            <form onSubmit={handleUpdateUserRole}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={selectedUser.name} disabled />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={selectedUser.email} disabled />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" defaultValue={selectedUser.role} required>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditUserModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Prediction Modal */}
      {showEditPredictionModal && selectedPrediction && (
        <div className="modal-overlay" onClick={() => setShowEditPredictionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Prediction</h2>
            <form onSubmit={handleUpdatePrediction}>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Area (m²)</label>
                  <input type="number" name="totalArea" defaultValue={selectedPrediction.propertyData?.total_area} required step="0.01" />
                </div>
                <div className="form-group">
                  <label>Kitchen Area (m²)</label>
                  <input type="number" name="kitchenArea" defaultValue={selectedPrediction.propertyData?.kitchen_area} required step="0.01" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Number of Rooms</label>
                  <input type="number" name="numberOfRooms" defaultValue={selectedPrediction.propertyData?.rooms_count} required />
                </div>
                <div className="form-group">
                  <label>Floor</label>
                  <input type="number" name="floor" defaultValue={selectedPrediction.propertyData?.floor} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Floors</label>
                  <input type="number" name="numberOfFloors" defaultValue={selectedPrediction.propertyData?.floor_max} required />
                </div>
                <div className="form-group">
                  <label>District</label>
                  <input type="text" name="district" defaultValue={selectedPrediction.propertyData?.district_name} required />
                </div>
              </div>
              <div className="form-group">
                <label>Predicted Price (₽)</label>
                <input type="number" name="predictedPrice" defaultValue={selectedPrediction.predictedPrice} required step="0.01" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditPredictionModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Prediction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
