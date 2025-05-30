const express = require('express');
const Feedback = require('../models/Feedback');
const router = express.Router();

// POST feedback
router.post('/', async (req, res) => {
    try {
        console.log('Received feedback request:', {
            headers: req.headers,
            body: req.body
        });
        const { ratings, comments } = req.body;
        
        if (!Array.isArray(ratings) || ratings.length === 0) {
            return res.status(400).json({ message: 'Invalid ratings data' });
        }

        if (!comments || typeof comments !== 'string') {
            return res.status(400).json({ message: 'Invalid comments' });
        }

        const feedback = new Feedback({ ratings, comments });
        const savedFeedback = await feedback.save();
        console.log('Saved feedback:', savedFeedback);
        res.status(201).json({ 
          message: 'Feedback submitted successfully',
          id: savedFeedback._id 
        });
    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).json({ message: 'Error submitting feedback' });
    }
});

// GET all feedback
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
