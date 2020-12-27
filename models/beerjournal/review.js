const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        pic: { type: String },
        picId: { type: String },
        price: { type: Number },
        location: { type: String, trim: true },
        rating: { type: Number, required: true },
        bitter: { type: Number, required: false },
        finish: { type: Number, required: false },
        notes: { type: String, trim: true },
        date: { type: Date, required: false },
        dateCreated: { type: Date, default: Date.now },
        beer: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Beer' },
        reviewer: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    },
    { usePushEach: true }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = { Review };
