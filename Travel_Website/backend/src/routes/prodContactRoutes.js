const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting for contact API
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 contact requests per hour
  message: 'Too many contact requests, please try again later'
});

// Input validation middleware
const validateContact = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('message').isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters')
];

// POST contact form
router.post('/', contactLimiter, validateContact, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, message } = req.body;
    
    // In production, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Process the contact request
    
    console.log('New contact request:', { name, email, message });
    
    res.status(200).json({ 
      success: true,
      message: 'Contact request received'
    });
    
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing contact request'
    });
  }
});

module.exports = router;
