const mongoose = require('mongoose');

const brewerySchema = new mongoose.Schema(
    {
        dateCreated: { type: Date, default: Date.now },
        name: { type: String, required: true, trim: true },
        altName: { type: String, trim: true },
        type: { type: String, trim: true },
        logo: { type: String, trim: true },
        logoId: { type: String, trim: true },
        location: { type: String, trim: true },
        description: { type: String, trim: true },
        tempBrewery: { type: Boolean, default: false },
        sumOfAllBeerRatings: { type: Number, default: 0 },
        totalNumberOfBeerRatings: { type: Number, default: 0 },
        averageBeerRating: { type: Number, default: 0 },
    },
    { usePushEach: true }
);

const bjDB = mongoose.connection.useDb('BrewFoam');
const Brewery = bjDB.model('Brewery', brewerySchema);

module.exports = { Brewery };
