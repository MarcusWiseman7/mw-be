const express = require('express');
const nodemailer = require('nodemailer');

const { mongoose } = require('../../db/mongoose');
const { bjBeerSelect } = require('../../utils/variables');
const { Beer } = require('../../models/beerjournal/beer');
const { Brewery } = require('../../models/beerjournal/brewery');
const { Review } = require('../../models/beerjournal/review');

const router = express.Router();

// Nodemailer transport
const smtpTransport = nodemailer.createTransport({
    host: 'smtp.office365.com',
    auth: { user: 'no-reply.beerjournal@outlook.com', pass: 'ckx3Ep1ACXvRneW' },
});

// Create new beer
router.post('/', async (req, res) => {
    try {
        const payload = Object.assign({}, req.body);
        let newBrewery;

        const checkBrewery = await Brewery.findOne({ name: payload.brewery });
        if (!checkBrewery) {
            newBrewery = await new Brewery({ name: payload.brewery });
            await newBrewery.save((err) => {
                if (err) return res.status(400).send(err);
            });
            payload.tempBrewery = true;
            payload.brewery = newBrewery._id;
        } else {
            const checkBeer = await Beer.findOne({ beerName: payload.beerName, brewery: checkBrewery._id });
            if (checkBeer) return res.status(200).send(checkBeer);

            payload.brewery = checkBrewery._id;
        }

        const beer = await new Beer(payload);
        await beer.save((err) => {
            if (err) return res.status(400).send(err);
        });

        const mailOptions = {
            to: 'md.wiseman@hotmail.com',
            from: '<no-reply.beerjournal@outlook.com>',
            subject: 'New Temp Beer',
            text: `Beer: ${beer} \n\n` + `Brewery: ${newBrewery || checkBrewery} \n\n`,
        };
        smtpTransport.sendMail(mailOptions, (err) => {
            if (err) return { err: 412 };
        });

        res.status(200).send(beer);
    } catch (err) {
        return res.status(400).send(err);
    }
});

// Retrieve temp beers
router.get('/tempBeers', async (req, res) => {
    try {
        const tempBeers = await Beer.find({ tempBeer: true })
            .select('_id beerName brewery style degrees abv bi logo tempBeer tempBrewery description')
            .populate('brewery');
        if (!tempBeers) return res.status(404).send();

        res.status(200).send(tempBeers);
    } catch (err) {
        return res.status(400).send(err);
    }
});

router.get('/topBeers', async (req, res) => {
    try {
        const top = await Beer.find({ tempBeer: false, averageRating: { $gt: 4 } })
            .select(bjBeerSelect)
            .populate('brewery');
        if (!top) return res.status(404).send({ statusCode: -2, message: 'Error finding top beers' });

        for (let i = top.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [top[i], top[j]] = [top[j], top[i]];
        }

        res.status(200).send({ topBeers: top.slice(0, 6) });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

// Retrieve all beers & breweries
router.get('/allBeers', async (req, res) => {
    try {
        const beers = await Beer.find({ tempBeer: false })
            .select(
                '_id beerName brewery style degrees abv bi logo description averagePrice averageRating totalNumberOfRatings'
            )
            .populate('brewery');
        const breweries = await Brewery.find().select('-__v -sumOfAllBeerRatings');
        const reviews = await Review.find().select('-__v').populate('reviewer');

        const top = await Beer.find({ tempBeer: false, averageRating: { $gt: 4 } })
            .select(
                '_id beerName brewery style degrees abv bi logo description averagePrice averageRating totalNumberOfRatings'
            )
            .populate('brewery');

        for (let i = top.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [top[i], top[j]] = [top[j], top[i]];
        }

        if (!beers || !breweries || !top) {
            let err = '';
            if (!beers) err += 'beers';
            if (!breweries) err += 'breweries';
            if (!top) err += 'top';
            return res.status(404).send({ statusCode: -2, message: `DB find error: no ${err}` });
        }

        res.status(200).send({ beers, breweries, reviews, topBeers: top.slice(0, 6) });
    } catch (err) {
        return res.status(400).send(err);
    }
});

// Update beer
router.patch('/:id', async (req, res) => {
    try {
        const beer = await Beer.findOneAndUpdate({ _id: req.params.id }, { $set: req.body }, { new: true });
        if (!beer) return res.status(404).send();

        res.status(200).send(beer);
    } catch (err) {
        return res.status(400).send(err);
    }
});

// Delete beer
router.delete('/:id', async (req, res) => {
    try {
        const beer = await Beer.findOneAndDelete({ _id: req.params.id });
        if (!beer) return res.status(404).send();

        res.status(200).send();
    } catch (err) {
        return res.status(400).send(err);
    }
});

module.exports = router;
