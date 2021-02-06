const express = require('express');

const { mongoose } = require('../../db/mongoose');
const { Beer } = require('../../models/brewfoam/beer');
const { Brewery } = require('../../models/brewfoam/brewery');
const { Review } = require('../../models/brewfoam/review');
const { bjUser } = require('../../models/brewfoam/user');
const { userSelect } = require('../../utils/vars');
const { bjBrewerySelect, bjBeerSelect, bjReviewSelect, averageRound } = require('../../utils/bjVars');

const router = express.Router();

// Create new brewery
router.post('/newBrewery', async (req, res) => {
    try {
        const checkBrewery = await Brewery.findOne({ name: req.body.name });
        if (checkBrewery) return res.status(403).send({ statusCode: -1, message: 'Brewery name alreay exists' });

        const brewery = await new Brewery(req.body).save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err, message: 'Error saving brewery' });
        });

        res.status(200).send({ statusCode: 1, brewery });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

// Retrieve brewery
router.get('/getBrewery/:id', async (req, res) => {
    try {
        const brewery = await Brewery.findOne({ _id: req.params.id }).select(bjBrewerySelect);
        if (!brewery) return res.status(404).send({ statusCode: -1, message: 'Brewery not found by id' });

        res.status(200).send({ statusCode: 1, brewery });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.patch('/updateBreweryRating/:id', async (req, res) => {
    try {
        const beers = await Beer.find();
        const breweries = await Brewery.find();

        await beers.forEach(async (beer) => {
            let reviews = await Review.find({ beer: beer._id });
            let allRatings = reviews.map((o) => o.rating).filter((j) => j != 0);
            if (allRatings && allRatings.length) {
                let total = allRatings.reduce((acc, x) => acc + x);
                let aveRating = averageRound(total, allRatings.length, 1);

                beer.sumOfAllRatings = total;
                beer.totalNumberOfRatings = allRatings.length;
                beer.averageRating = aveRating;

                await beer.save((err) => {
                    if (err)
                        return res.status(400).send({ statusCode: -1, dbSaveError: err, message: 'Error saving beer' });
                });
            }
        });

        await breweries.forEach(async (brewery) => {
            const beers = await Beer.find({ brewery: brewery._id });
            const rates = beers.map((x) => x.averageRating).filter((x) => x != 0);
            if (rates && rates.length) {
                const total = rates.reduce((acc, x) => acc + x);
                const averageRating = averageRound(total, rates.length, 1);

                brewery.sumOfAllBeerRatings = total;
                brewery.totalNumberOfBeerRatings = rates.length;
                brewery.averageBeerRating = averageRating;

                await brewery.save((err) => {
                    if (err)
                        return res
                            .status(400)
                            .send({ statusCode: -1, dbSaveError: err, message: 'Error saving brewery' });
                });
            }
        });

        res.status(200).send({ statusCode: 1 });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.patch('/updateBreweryRating/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const brewery = await Brewery.findOne({ _id: id }).select(bjBrewerySelect);
        if (!brewery) return res.status(404).send({ statusCode: -1, message: 'Brewery not found by id' });

        const beers = await Beer.find({ brewery: id })
            .select(bjBeerSelect)
            .populate({ path: 'brewery', model: Brewery, select: bjBrewerySelect });
        if (!beers) return res.status(404).send({ statusCode: -1, message: 'Beers not found by brewery id' });

        const rates = beers.map((x) => x.averageRating).filter((x) => x != 0);
        const total = rates.reduce((acc, x) => acc + x);
        const averageRating = averageRound(total, rates.length, 1);

        brewery.sumOfAllBeerRatings = total;
        brewery.totalNumberOfBeerRatings = rates.length;
        brewery.averageBeerRating = averageRating;

        await brewery.save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err, message: 'Error saving brewery' });
        });

        const topIds = beers.map((x) => x._id);

        const reviews = await Review.find({ beer: topIds })
            .select(bjReviewSelect)
            .populate({ path: 'reviewer', model: bjUser, select: userSelect });

        res.status(200).send({ statusCode: 1, brewery, beers, reviews });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

// Update brewery
router.patch('/:id', async (req, res) => {
    try {
        const brewery = await Brewery.findOneAndUpdate(
            { _id: req.params.id },
            { $set: req.body },
            { new: true }
        ).select(bjBrewerySelect);
        if (!brewery) return res.status(404).send({ statusCode: -1, message: 'Brewery not found by id' });

        res.status(200).send({ statusCode: 1, brewery });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

// Delete brewery
router.delete('/:id', async (req, res) => {
    try {
        const brewery = await Brewery.findOneAndDelete({ _id: req.params.id });
        if (!brewery) return res.status(404).send({ statusCode: -1, message: 'Brewery not found by id' });

        res.status(200).send({ statusCode: 1, message: 'Brewery deleted' });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

module.exports = router;
