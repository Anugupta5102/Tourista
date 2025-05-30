const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ServerConfig } = require('../config');

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.writeHead(400);
      return res.end(JSON.stringify({ 
        message: 'Email already registered' 
      }));
    }

    // Create new user with role
    const user = new User({ 
      name, 
      email, 
      password,
      role: role || 'user' // Default to 'user' if role not specified
    });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      ServerConfig.JWT_KEY,
      { expiresIn: '1d' }
    );

    // Set cookie with token
    res.setHeader('Set-Cookie', 
      `access_token=${token}; Path=/; HttpOnly; SameSite=Strict`);

    res.end(JSON.stringify({ 
      success: true,
      user: { 
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }));

  } catch (error) {
    console.error('Signup error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ 
      message: 'Error creating user account' 
    }));
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.writeHead(401);
      return res.end(JSON.stringify({ 
        message: 'Invalid credentials' 
      }));
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.writeHead(401);
      return res.end(JSON.stringify({ 
        message: 'Invalid credentials' 
      }));
    }

    // Generate JWT token with role
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      ServerConfig.JWT_KEY,
      { expiresIn: '1d' }
    );

    // Set cookie with token
    res.setHeader('Set-Cookie', 
      `access_token=${token}; Path=/; HttpOnly; SameSite=Strict`);

    res.end(JSON.stringify({ 
      success: true,
      user: { 
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }));

  } catch (error) {
    console.error('Login error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ 
      message: 'Error logging in' 
    }));
  }
};
