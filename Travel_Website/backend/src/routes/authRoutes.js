const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signup, login } = require('../controllers/user-controller');
const { forgotPassword, resetPassword } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const { ServerConfig } = require('../config');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: 'Too many attempts, please try again later'
});

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', authLimiter, resetPassword);

// Session verification endpoint
router.get('/verify-session', async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) return res.json({ authenticated: false });
        
        const decoded = jwt.verify(token, ServerConfig.JWT_KEY);
        const user = await User.findById(decoded.userId);
        
        if (!user) return res.json({ authenticated: false });
        
        res.json({
            authenticated: true,
            user: {
                username: user.name,
                email: user.email
            }
        });
    } catch (err) {
        res.json({ authenticated: false });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.json({ success: true });
});

module.exports = router;
