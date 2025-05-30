const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// Get dashboard data for regular users
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId)
      .populate({
        path: 'bookings',
        select: 'package travelDate status paymentStatus totalAmount',
        options: { sort: { travelDate: -1 }, limit: 5 }
      })
      .populate({
        path: 'paymentHistory',
        select: 'amount paymentDate status',
        options: { sort: { paymentDate: -1 }, limit: 5 }
      })
      .select('name email role');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      },
      recentBookings: user.bookings,
      recentPayments: user.paymentHistory
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get dashboard data for admin users
exports.getAdminDashboard = async (req, res) => {
  try {
    // Verify admin role
    const admin = await User.findById(req.userId);
    if (admin.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [users, bookings, payments] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Payment.countDocuments(),
      Booking.find().sort({ bookingDate: -1 }).limit(5),
      Payment.find().sort({ paymentDate: -1 }).limit(5)
    ]);

    res.json({
      stats: {
        totalUsers: users,
        totalBookings: bookings,
        totalPayments: payments
      },
      recentBookings,
      recentPayments
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
