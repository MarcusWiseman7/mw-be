const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        pic: { type: String, trim: true },
        picId: { type: String, trim: true },
        price: { type: Number },
        location: { type: String, trim: true },
        rating: { type: Number, required: true },
        bitter: { type: Number },
        finish: { type: Number },
        notes: { type: String, trim: true },
        date: { type: Date },
        dateCreated: { type: Date, default: Date.now },
        beer: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Beer' },
        reviewer: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'bjUser' },
    },
    { usePushEach: true }
);

const bjDB = mongoose.connection.useDb('BrewFoam');
const Review = bjDB.model('Review', reviewSchema);

module.exports = { Review };
