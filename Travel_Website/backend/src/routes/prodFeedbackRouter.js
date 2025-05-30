const express = require('express');
const Feedback = require('../models/Feedback');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting for feedback API
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 feedback submissions per hour
  message: 'Too many feedback submissions, please try again later'
});

// Input validation middleware
const validateFeedback = [
  body('ratings').isArray({ min: 1 }).withMessage('At least one rating required'),
  body('ratings.*').isInt({ min: 1, max: 5 }).withMessage('Ratings must be 1-5'),
  body('comments').isString().trim().isLength({ min: 10, max: 500 })
    .withMessage('Comments must be 10-500 characters')
];

// POST feedback
router.post('/', feedbackLimiter, validateFeedback, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { ratings, comments } = req.body;
    const feedback = new Feedback({ 
      ratings, 
      comments,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    await feedback.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Feedback submitted successfully'
    });
    
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting feedback'
    });
  }
});

// GET feedback (admin only)
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .select('-__v');
      
    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });
    
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching feedback'
    });
  }
});

module.exports = router;
