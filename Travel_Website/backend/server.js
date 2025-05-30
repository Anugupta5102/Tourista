const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const url = require('url');
const querystring = require('querystring');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');
const { ServerConfig } = require('./src/config');

dotenv.config();

const PORT_START = process.env.PORT || 5000;

// Function to find available port
const getAvailablePort = (startPort) => new Promise((resolve) => {
  const testServer = http.createServer();
  testServer.listen(startPort, () => {
    testServer.close(() => resolve(startPort));
  });
  testServer.on('error', () => resolve(getAvailablePort(startPort + 1)));
});

// Rate limiting
const rateLimit = (windowMs, max) => {
  const requests = new Map();
  return (req, res, next) => {
    const ip = req.socket.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    requests.set(ip, (requests.get(ip) || []).filter(t => t > windowStart));
    
    if (requests.get(ip).length >= max) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        message: 'Too many attempts, please try again later' 
      }));
    }
    
    requests.get(ip).push(now);
    next();
  };
};

// Request parser middleware
const parseRequest = (req, res, next) => {
  let body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    req.body = body.length ? JSON.parse(Buffer.concat(body)) : {};
    req.cookies = cookie.parse(req.headers.cookie || '');
    req.query = querystring.parse(url.parse(req.url).query || '');
    next();
  });
};

// Create server
const server = http.createServer(async (req, res) => {
  // Parse request
  await new Promise(resolve => parseRequest(req, res, resolve));
  
  // Set headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Route handling
  const { pathname } = url.parse(req.url);

  // Authentication middleware for protected routes
  const requireAuth = async (req, res) => {
    const token = req.cookies.access_token;
    if (!token) {
      res.writeHead(401);
      return res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    try {
      const decoded = jwt.verify(token, ServerConfig.JWT_KEY);
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.writeHead(401);
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
      req.userId = user._id; // Attach user ID to request
      return true;
    } catch (err) {
      res.writeHead(401);
      return res.end(JSON.stringify({ error: 'Unauthorized' }));
    }
  };

  // Apply auth middleware to protected routes
  const protectedRoutes = [
    '/api/payments',
    '/api/bookings', 
    '/api/feedback'
  ];

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const isAuthenticated = await requireAuth(req, res);
    if (!isAuthenticated) return;
  }
  
  // Auth routes
  if (pathname === '/api/auth/signup' && req.method === 'POST') {
    const { signup } = require('./src/controllers/authController');
    return await signup(req, res);
  }
  
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const { login } = require('./src/controllers/authController');
    return await login(req, res);
  }

  if (pathname === '/api/auth/verify-session' && req.method === 'GET') {
    const token = req.cookies.access_token;
    if (!token) return res.end(JSON.stringify({ authenticated: false }));

    try {
      const decoded = jwt.verify(token, ServerConfig.JWT_KEY);
      const user = await User.findById(decoded.userId);
      
      if (!user) return res.end(JSON.stringify({ authenticated: false }));
      
      res.end(JSON.stringify({
        authenticated: true,
        user: { username: user.name, email: user.email }
      }));
    } catch (err) {
      res.end(JSON.stringify({ authenticated: false }));
    }
    return;
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', 'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
    const { forgotPassword } = require('./src/controllers/authController');
    return await forgotPassword(req, res);
  }

  if (pathname.match(/^\/api\/auth\/reset-password\/.+/) && req.method === 'PUT') {
    const { resetPassword } = require('./src/controllers/authController');
    return await resetPassword(req, res);
  }

  // Payment routes
  if (pathname === '/api/payments' && req.method === 'POST') {
    const { processPayment } = require('./src/controllers/paymentController');
    return await processPayment(req, res);
  }

  // Booking routes
  if (pathname === '/api/bookings' && req.method === 'POST') {
    const { createBooking } = require('./src/controllers/bookingController');
    return await createBooking(req, res);
  }

  // Feedback routes
  if (pathname === '/api/feedback' && req.method === 'POST') {
    const { submitFeedback } = require('./src/controllers/feedbackController');
    return await submitFeedback(req, res);
  }

  // Dashboard routes
  if (pathname === '/api/dashboard' && req.method === 'GET') {
    const { getUserDashboard, getAdminDashboard } = require('./src/controllers/dashboardController');
    
    // Verify authentication first
    const isAuthenticated = await requireAuth(req, res);
    if (!isAuthenticated) return;

    // Check user role and route accordingly
    const user = await User.findById(req.userId);
    if (user.role === 'admin') {
      return await getAdminDashboard(req, res);
    } else {
      return await getUserDashboard(req, res);
    }
  }

  // Static file serving
  if (req.method === 'GET') {
    try {
      const filePath = path.join(__dirname, '../frontend', pathname === '/' ? 'index.html' : pathname);
      if (fs.existsSync(filePath)) {
        const fileStream = fs.createReadStream(filePath);
        res.setHeader('Content-Type', getContentType(filePath));
        fileStream.pipe(res);
        return;
      }
    } catch (err) {
      console.error('Static file error:', err);
    }
  }

  // 404 handler
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// DB connection
mongoose.connect(process.env.DATABASE_URL)
  .then(async () => {
    console.log('MongoDB connected');
    const port = await getAvailablePort(PORT_START);
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Available endpoints:`);
      console.log(`- POST /api/auth/signup`);
      console.log(`- POST /api/auth/login`);
      // Add other endpoints here
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  server.close(() => {
    mongoose.disconnect();
    console.log('Server stopped');
    process.exit(0);
  });
});
