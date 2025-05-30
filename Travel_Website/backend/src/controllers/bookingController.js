const Booking = require('../models/Booking');

exports.createBooking = async (req, res) => {
  try {
    const { packageId, travelDate, travelers } = req.body;
    const userId = req.userId; // Set from auth middleware

    // Validate booking data
    if (!packageId || !travelDate || !travelers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const booking = new Booking({
      package: packageId,
      user: userId,
      travelDate,
      travelers,
      status: 'confirmed',
      createdAt: new Date()
    });

    await booking.save();

    res.status(201).json({
      success: true,
      bookingId: booking._id,
      status: booking.status
    });

  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ error: 'Booking creation failed' });
  }
};
