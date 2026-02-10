import { useAuth } from '../context/AuthContext'

const RoleIndicator = () => {
  const { user } = useAuth()

  if (!user || !user.role) return null

  const isAdmin = user.role === 'admin'

  return (
    <div className={`role-badge ${isAdmin ? 'admin' : 'user'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {isAdmin ? (
          // Shield icon for admin
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        ) : (
          // User icon for regular user
          <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </>
        )}
      </svg>
      <span>{isAdmin ? 'Admin' : 'User'}</span>
    </div>
  )
}

export default RoleIndicator
