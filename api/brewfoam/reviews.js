const express = require('express');

const { userSelect } = require('../../utils/vars');
const { bjBeerSelect, bjReviewSelect, bjBrewerySelect, averageRound } = require('../../utils/bjVars');
const { mongoose } = require('../../db/mongoose');
const { Review } = require('../../models/brewfoam/review');
const { Beer } = require('../../models/brewfoam/beer');
const { User } = require('../../models/brewfoam/user');
const { Brewery } = require('../../models/brewfoam/brewery');

const router = express.Router();

const populateParams = {
    path: 'reviews',
    model: Review,
    select: bjReviewSelect,
    populate: {
        path: 'beer',
        model: Beer,
        select: bjBeerSelect,
        populate: { path: 'brewery', model: Brewery, select: bjBrewerySelect },
    },
};

// Create new review
router.post('/addReview', async (req, res) => {
    try {
        const review = await new Review(req.body);
        await review.save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err, message: 'Error saving review' });
        });

        const beer = await Beer.findOne({ _id: review.beer }).populate({
            path: 'brewery',
            model: Brewery,
            select: bjBrewerySelect,
        });
        if (!beer) return res.status(404).send({ statusCode: -1, message: 'Beer not found by id' });

        beer.sumOfAllRatings = +beer.sumOfAllRatings + +review.rating;
        beer.totalNumberOfRatings = +beer.totalNumberOfRatings + 1;
        beer.averageRating = averageRound(+beer.sumOfAllRatings, +beer.totalNumberOfRatings, 1);
        console.log('beer.averageRating :>> ', beer.averageRating);

        await beer.save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err, message: 'Error saving beer' });
        });

        const user = await User.findOneAndUpdate(
            { _id: review.reviewer },
            { $push: { reviews: review._id } },
            { new: true }
        )
            .select(userSelect)
            .populate(populateParams);
        if (!user) return res.status(404).send({ statusCode: -1, message: 'User not found by id' });

        res.status(200).send({ statusCode: 1, user, beer });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

// Retrieve all reviews for a beer
router.get('/:beerId', async (req, res) => {
    try {
        const reviews = await Review.find({ beer: req.params.beerId }).populate({
            path: 'reviewer',
            model: Review,
            select: userSelect,
        });
        if (!reviews) return res.status(404).send({ statusCode: -1, message: 'Reviews not found by beer id' });

        res.status(200).send({ statusCode: 1, reviews });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

// Delete review
router.delete('/:id/:userId', async (req, res) => {
    try {
        const reviewId = req.params.id;

        // Remove review id from user reviews
        const user = await User.findOneAndUpdate(
            { _id: req.params.userId },
            { $pull: { reviews: reviewId } },
            { new: true }
        )
            .select(userSelect)
            .populate(populateParams);
        if (!user) return res.status(404).send({ statusCode: -1, message: 'User not found by id' });

        // Delete review
        const review = await Review.findOneAndRemove({ _id: reviewId });
        if (!review) return res.status(404).send({ statusCode: -1, message: 'Review not found by id' });

        // Update beer
        const beer = await Beer.findOne({ _id: review.beer }).populate({
            path: 'brewery',
            model: Brewery,
            select: bjBrewerySelect,
        });
        if (!beer) return res.status(404).send({ statusCode: -1, message: 'Beer not found by id' });

        beer.sumOfAllRatings = +beer.sumOfAllRatings - +review.rating;
        beer.totalNumberOfRatings = +beer.totalNumberOfRatings - 1;
        if (beer.sumOfAllRatings >= 0 && beer.totalNumberOfRatings > 0) {
            beer.averageRating = averageRound(+beer.sumOfAllRatings, +beer.totalNumberOfRatings, 1);
        } else {
            beer.averageRating = 0;
        }

        await beer.save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err, message: 'Error saving beer' });
        });

        // Remove pic from cloudinary
        if (review.picId && review.picId.length > 0) {
            await cloud.deletePic(review.picId);
        }

        res.status(200).send({ statusCode: 1, message: 'Review deleted', user, beer });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

module.exports = router;
