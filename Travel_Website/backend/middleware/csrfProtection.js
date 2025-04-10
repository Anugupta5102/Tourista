const csrf = require('csurf');
const { StatusCodes } = require('http-status-codes');

// Configure CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Middleware to generate and verify CSRF tokens
const csrfMiddleware = (req, res, next) => {
  // Skip CSRF for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }

  csrfProtection(req, res, (err) => {
    if (err) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Invalid CSRF token'
      });
    }
    
    // Make CSRF token available to templates
    res.locals.csrfToken = req.csrfToken();
    next();
  });
};

module.exports = csrfMiddleware;
