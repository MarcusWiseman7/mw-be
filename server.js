const express = require('express');
const consola = require('consola');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');

const users = require('./api/users');
const auth = require('./api/auth');

// brewfoam vars
const bjBeers = require('./api/brewfoam/beers');
const bjBreweries = require('./api/brewfoam/breweries');
const bjReviews = require('./api/brewfoam/reviews');

const app = express();

const PORT = process.env.PORT;

// App middleware
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', users);
app.use('/auth', auth);

// brewfoam routes
app.use('/brewfoam/beers', bjBeers);
app.use('/brewfoam/breweries', bjBreweries);
app.use('/brewfoam/reviews', bjReviews);

// Listen the server
app.listen(PORT, () => {
    consola.ready({
        message: `Server listening on PORT ${PORT}`,
        badge: true,
    });
});
