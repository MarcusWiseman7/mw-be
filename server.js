const express = require('express');
const consola = require('consola');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const users = require('./api/users');
const auth = require('./api/auth');

const bjBeers = require('./api/beerjournal/beers');
const bjBreweries = require('./api/beerjournal/breweries');
const bjReviews = require('./api/beerjournal/reviews');

const PORT = process.env.PORT || 8080;
const app = express();

// App middleware
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', users);
app.use('/auth', auth);

// Beerjournal routes
app.use('/beerjournal/beers', bjBeers);
app.use('/beerjournal/breweries', bjBreweries);
app.use('/beerjournal/reviews', bjReviews);

// Listen the server
app.listen(PORT, () => {
    consola.ready({
        message: `Server listening on PORT ${PORT}`,
        badge: true,
    });
});
