const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting for deals API
const dealsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

// Input validation middleware
const validateDeal = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('discount').isFloat({ min: 0, max: 100 }).withMessage('Valid discount required'),
  body('validUntil').isISO8601().withMessage('Valid date required')
];

// GET all deals
router.get('/', dealsLimiter, async (req, res) => {
  try {
    // In production, you would fetch from database
    const deals = [
      {
        id: 1,
        title: "Summer Special",
        description: "20% off all summer packages",
        discount: 20,
        validUntil: "2023-08-31"
      }
    ];
    
    res.json({
      success: true,
      deals
    });
    
  } catch (error) {
    console.error('Deals error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching deals'
    });
  }
});

module.exports = router;
