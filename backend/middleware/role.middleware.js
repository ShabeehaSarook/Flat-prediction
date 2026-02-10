/**
 * Role-based Access Control Middleware
 * Supports Admin and User roles
 */

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user; // Assuming user is attached by auth middleware
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }
      
      if (!user.role) {
        return res.status(403).json({
          status: 'error',
          message: 'User role not defined'
        });
      }
      
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Insufficient permissions.',
          requiredRoles: allowedRoles,
          userRole: user.role
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error checking permissions'
      });
    }
  };
};

const isAdmin = checkRole('admin');
const isUser = checkRole('user', 'admin');

module.exports = {
  checkRole,
  isAdmin,
  isUser
};
