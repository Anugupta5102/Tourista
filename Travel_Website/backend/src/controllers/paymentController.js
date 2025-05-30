const Payment = require('../models/Payment');

exports.processPayment = async (req, res) => {
  try {
    const { amount, cardDetails, bookingId } = req.body;
    const userId = req.userId; // Set from auth middleware
    
    // Validate payment details
    if (!amount || !cardDetails || !bookingId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Process payment (in a real app, integrate with payment gateway)
    const payment = new Payment({
      amount,
      booking: bookingId,
      user: userId,
      status: 'completed',
      paymentMethod: 'card'
    });

    await payment.save();

    res.status(201).json({
      success: true,
      paymentId: payment._id
    });

  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
};
