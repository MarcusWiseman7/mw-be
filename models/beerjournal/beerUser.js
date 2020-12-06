const mongoose = require('../../db/mongoose');
const { User } = require('../user');

const beerUserSchema = User.discriminator(
    'BeerUser',
    new mongoose.Schema({
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
        darkMode: { type: Boolean, default: false },
    }),
    { discriminatorKey: 'kind' }
);

module.exports = { BeerUser };
