const express = require('express');
const Feedback = require('../models/Feedback');
const router = express.Router();

// POST feedback
router.post('/', async (req, res) => {
    try {
        const { ratings, comments } = req.body;
        
        // Validate ratings array
        if (!Array.isArray(ratings) || ratings.length === 0) {
            return res.status(400).json({ message: 'Invalid ratings data' });
        }

        // Validate comments
        if (!comments || typeof comments !== 'string') {
            return res.status(400).json({ message: 'Invalid comments' });
        }

        const feedback = new Feedback({
            ratings,
            comments
        });

        await feedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).json({ message: 'Error submitting feedback' });
    }
});

// GET all feedback (for admin purposes)
router.get('/', async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Error fetching feedback' });
    }
});

module.exports = router;
