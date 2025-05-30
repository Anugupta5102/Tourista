const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting for booking API
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many booking attempts, please try again later'
});

// Input validation middleware
const validateBooking = [
  body('package').notEmpty().withMessage('Package is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Valid amount is required'),
  body('paymentMethod').isIn(['credit', 'debit', 'paypal']).withMessage('Invalid payment method'),
  body('userDetails').isObject().withMessage('User details required'),
  body('userDetails.firstName').notEmpty().isLength({ max: 50 }).withMessage('Valid first name required'),
  body('userDetails.lastName').notEmpty().isLength({ max: 50 }).withMessage('Valid last name required'),
  body('userDetails.email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('userDetails.address').notEmpty().withMessage('Address required'),
  body('userDetails.zip').isPostalCode('IN').withMessage('Valid ZIP code required')
];

// Create new booking
router.post('/', bookingLimiter, validateBooking, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const booking = new Booking({
      ...req.body,
      bookingDate: new Date(),
      paymentStatus: 'completed'
    });
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      bookingId: booking._id,
      message: 'Booking confirmed'
    });
    
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Booking failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(req.params.id).select('-__v');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      success: true,
      booking
    });

  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving booking'
    });
  }
});

module.exports = router;
