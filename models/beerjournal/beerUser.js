const mongoose = require('mongoose');
const { User } = require('../user');

const BeerUser = User.discriminator(
    'BeerUser',
    new mongoose.Schema({
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
        darkMode: { type: Boolean, default: false },
    })
);

module.exports = { BeerUser };
