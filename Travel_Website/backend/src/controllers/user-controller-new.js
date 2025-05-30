const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ServerConfig } = require('../config');
const { sendEmail } = require('../../utils/sendEmail');

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ 
      success: false,
      message: 'Email already in use'
    }));
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token and set cookies
    const token = jwt.sign({ userId: user._id }, ServerConfig.JWT_KEY, { expiresIn: '1h' });
    res.setHeader('Set-Cookie', [
      `access_token=${token}; HttpOnly; Path=/; Max-Age=3600`,
      `logged_in=true; Path=/; Max-Age=3600`
    ]);

    // Try to send welcome email (but don't fail registration if email fails)
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Travel Website',
        text: `Hi ${name}, welcome to our travel platform!`
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }));

  } catch (err) {
    console.error('Signup error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false,
      message: 'Registration failed'
    }));
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        message: 'Invalid credentials'
      }));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        message: 'Invalid credentials'
      }));
    }

    // Generate token and set cookies
    const token = jwt.sign({ userId: user._id }, ServerConfig.JWT_KEY, { expiresIn: '1h' });
    res.setHeader('Set-Cookie', [
      `access_token=${token}; HttpOnly; Path=/; Max-Age=3600`,
      `logged_in=true; Path=/; Max-Age=3600`
    ]);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }));

  } catch (err) {
    console.error('Login error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'Login failed'
    }));
  }
};
