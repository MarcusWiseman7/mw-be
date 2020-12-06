// Mongo database
const mongoose = require('mongoose');

const ext = process.env.MONGO_URL_EXT || '';

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/' + ext, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
});

module.exports = { mongoose };
