const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');

exports.submitFeedback = async (req, res) => {
  try {
    const { bookingId, rating, comments } = req.body;
    const userId = req.userId;

    // Validate feedback data
    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid feedback data' });
    }

    // Verify booking exists and belongs to user
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const feedback = new Feedback({
      booking: bookingId,
      user: userId,
      rating,
      comments: comments || '',
      dateSubmitted: new Date()
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      feedbackId: feedback._id
    });

  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(500).json({ error: 'Feedback submission failed' });
  }
};
