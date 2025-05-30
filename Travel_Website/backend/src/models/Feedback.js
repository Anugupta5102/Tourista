const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    ratings: {
        type: [Number],
        required: true
    },
    comments: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
