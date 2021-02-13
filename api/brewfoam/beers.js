const express = require('express');
const nodemailer = require('nodemailer');

const { mongoose } = require('../../db/mongoose');
const { bjBeerSelect, bjTempBeerSelect, bjReviewSelect, bjBrewerySelect } = require('../../utils/bjVars');
const { userSelect } = require('../../utils/vars');
const { Beer } = require('../../models/brewfoam/beer');
const { Brewery } = require('../../models/brewfoam/brewery');
const { Review } = require('../../models/brewfoam/review');
const { bjUser } = require('../../models/brewfoam/user');

const router = express.Router();

// Nodemailer transport
const smtpTransport = nodemailer.createTransport({
    host: 'smtp.office365.com',
    auth: { user: 'no-reply.beerjournal@outlook.com', pass: process.env.BJ_EMAIL_PASS },
});

// Create new beer
router.post('/addNewBeer', async (req, res) => {
    try {
        const payload = JSON.parse(JSON.stringify(req.body));
        let newBrewery;

        const checkBrewery = await Brewery.findOne({ name: payload.brewery });
        if (!checkBrewery) {
            newBrewery = await new Brewery({ name: payload.brewery, tempBrewery: true });
            newBrewery.altName = newBrewery.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            await newBrewery.save((err) => {
                if (err)
                    return res
                        .status(400)
                        .send({ statusCode: -1, dbSaveError: err, message: 'Error saving new brewery' });
            });
            payload.tempBrewery = true;
            payload.brewery = newBrewery._id;
        } else {
            const checkBeer = await Beer.findOne({ beerName: payload.beerName, brewery: checkBrewery._id });
            if (checkBeer)
                return res.status(200).send({ statusCode: 2, beer: checkBeer, message: 'Beer already exists' });

            payload.brewery = checkBrewery._id;
        }

        payload.altName = payload.beerName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const beer = await new Beer(payload);
        await beer.save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err, message: 'Error saving beer' });
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

        res.status(200).send({ statusCode: 1, beer });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.patch('/normalizeNames', async (req, res) => {
    try {
        const beers = await Beer.find();
        const breweries = await Brewery.find();

        await beers.forEach(async (beer) => {
            beer.altName = beer.beerName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            await beer.save((err) => {
                if (err)
                    return res.status(400).send({ statusCode: -1, dbSaveError: err, message: 'Error saving beer' });
            });
        });

        await breweries.forEach(async (brewery) => {
            brewery.altName = brewery.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            await brewery.save((err) => {
                if (err)
                    return res.status(400).send({ statusCode: -1, dbSaveError: err, message: 'Error saving brewery' });
            });
        });

        res.status(200).send({ statusCode: 1 });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.patch('/updateDB', async (req, res) => {
    try {
        const breweries = await Brewery.find();
        const users = await bjUser.find();

        breweries.forEach(async (brewery) => {
            if (!brewery.hasOwnProperty('tempBrewery')) {
                brewery.tempBrewery = false;

                await brewery.save((err) => {
                    if (err)
                        return res
                            .status(400)
                            .send({ statusCode: -1, dbSaveError: err, message: 'Error saving brewery' });
                });
            }
        });

        users.forEach(async (user) => {
            user.loginToken = '';

            await user.save((err) => {
                if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err });
            });
        });

        res.status(200).send({ statusCode: 1 });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.get('/search/:q', async (req, res) => {
    try {
        const q = req.params.q;
        const beers = await Beer.find({
            $and: [
                { tempBrewery: false },
                { $or: [{ beerName: { $regex: q, $options: 'i' } }, { altName: { $regex: q, $options: 'i' } }] },
            ],
        })
            .select(bjBeerSelect)
            .populate({ path: 'brewery', model: Brewery, select: bjBrewerySelect });
        const breweries = await Brewery.find({
            $and: [
                { tempBrewery: false },
                { $or: [{ name: { $regex: q, $options: 'i' } }, { altName: { $regex: q, $options: 'i' } }] },
            ],
        }).select(bjBrewerySelect);

        let results = beers.concat(breweries).sort(function (a, b) {
            let x = a.name || a.beerName;
            let y = b.name || b.beerName;

            return x.toLowerCase().localeCompare(y.toLowerCase());
        });

        res.status(200).send({ statusCode: 1, results });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.get('/singleBeer/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const beer = await Beer.findOne({ _id: id })
            .select(bjBeerSelect)
            .populate({ path: 'brewery', model: Brewery, select: bjBrewerySelect });
        if (!beer) return res.status(404).send({ statusCode: -1, message: 'Beer not found' });

        const reviews = await Review.find({ beer: id })
            .select(bjReviewSelect)
            .populate({ path: 'reviewer', model: bjUser, select: userSelect });

        res.status(200).send({ statusCode: 1, beer, reviews });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.get('/tempBeers', async (req, res) => {
    try {
        const tempBeers = await Beer.find({ tempBeer: true })
            .select(bjTempBeerSelect)
            .populate({ path: 'brewery', model: Brewery, select: bjBrewerySelect });
        if (!tempBeers) return res.status(404).send({ statusCode: -1, message: 'TempBeers not found' });

        res.status(200).send({ statusCode: 1, tempBeers });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.get('/topBeers', async (req, res) => {
    try {
        const top = await Beer.find({ tempBeer: false, averageRating: { $gt: 4 } })
            .select(bjBeerSelect)
            .populate({ path: 'brewery', model: Brewery, select: bjBrewerySelect });
        if (!top) return res.status(404).send({ statusCode: -2, message: 'Error finding top beers' });

        for (let i = top.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [top[i], top[j]] = [top[j], top[i]];
        }

        const topBeers = top.slice(0, 6);
        const topIds = topBeers.map((x) => x._id);

        const reviews = await Review.find({ beer: topIds })
            .select(bjReviewSelect)
            .populate({ path: 'reviewer', model: bjUser, select: userSelect });

        res.status(200).send({ statusCode: 1, topBeers, reviews });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

// Retrieve all beers & breweries
router.get('/allBeers', async (req, res) => {
    try {
        const beers = await Beer.find({ tempBeer: false })
            .select(bjBeerSelect)
            .populate({ path: 'brewery', model: Brewery, select: bjBrewerySelect });
        const breweries = await Brewery.find().select(bjBrewerySelect);
        const reviews = await Review.find()
            .select(bjReviewSelect)
            .populate({ path: 'reviewer', model: bjUser, select: userSelect });

        const top = await Beer.find({ tempBeer: false, averageRating: { $gt: 4 } })
            .select(bjBeerSelect)
            .populate({ path: 'brewery', model: Brewery, select: bjBrewerySelect });

        for (let i = top.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [top[i], top[j]] = [top[j], top[i]];
        }

        if (!beers || !breweries || !top || !reviews) {
            let err = '';
            if (!beers) err += ' beers';
            if (!breweries) err += ' breweries';
            if (!top) err += ' top';
            if (!reviews) err += ' reviews';
            return res.status(404).send({ statusCode: -2, message: `DB find error: no ${err}` });
        }

        res.status(200).send({ statusCode: 1, beers, breweries, reviews, topBeers: top.slice(0, 6) });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

// Update beer
router.patch('/:id', async (req, res) => {
    try {
        const beer = await Beer.findOneAndUpdate({ _id: req.params.id }, { $set: req.body }, { new: true });
        if (!beer) return res.status(404).send({ statusCode: -1, message: 'Beer not found by id' });

        res.status(200).send({ statusCode: 1, beer });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

// Delete beer
router.delete('/:id', async (req, res) => {
    try {
        const beer = await Beer.findOneAndDelete({ _id: req.params.id });
        if (!beer) return res.status(404).send({ statusCode: -1, message: 'Beer not found by id' });

        res.status(200).send({ statusCode: 1, message: 'Beer deleted' });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

module.exports = router;
