const express = require('express');

const { bjReviewSelect } = require('../../utils/variables');
const { mongoose } = require('../../db/mongoose');
const { Review } = require('../../models/beerjournal/review');
const { Beer } = require('../../models/beerjournal/beer');
const { User } = require('../../models/user');

const router = express.Router();

const populateParams = {
    path: 'reviews',
    populate: {
        path: 'beer',
        populate: { path: 'brewery' },
    },
};

const averageRound = (a, b, c) => {
    const x = Math.pow(10, c || 0);
    return Math.round((a / b) * x) / x;
};

// Create new review
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        // const file = req.files[0] ? req.files[0].path : null;

        // if (file) {
        //     await cloud.uploads({ file, folder: 'reviews' }).then((result) => {
        //         body.pic = result.url;
        //         body.picId = result.public_id;
        //     });

        //     if (body.pic && body.pic.length) {
        //         fs.unlink(file, (err) => {
        //             if (err) throw err;
        //         });
        //     } else {
        //         return res.status(400).send();
        //     }
        // }

        const review = await new Review(body);
        await review.save((err) => {
            if (err) return res.status(400).send(err);
        });

        const beer = await Beer.findOne({ _id: review.beer }).populate({ path: 'brewery' });
        if (!beer) return res.status(404).send();

        beer.sumOfAllRatings = +beer.sumOfAllRatings + +review.rating;
        beer.totalNumberOfRatings = +beer.totalNumberOfRatings + 1;
        beer.averageRating = averageRound(+beer.sumOfAllRatings, +beer.totalNumberOfRatings, 1);

        if (review.price) {
            beer.sumOfAllPrices = +beer.sumOfAllPrices + +review.price;
            beer.totalNumberOfPrices = +beer.totalNumberOfPrices + 1;
            beer.averagePrice = averageRound(+beer.sumOfAllPrices, +beer.totalNumberOfPrices, 0);
        }

        await beer.save((err) => {
            if (err) return res.status(400).send(err);
        });

        const user = await User.findOneAndUpdate(
            { _id: review.reviewer },
            { $push: { reviews: review._id } },
            { new: true }
        )
            .select('_id name surname email darkMode avatar avatarId')
            .populate(populateParams);
        if (!user) return res.status(404).send();

        res.status(200).send({ user, beer });
    } catch (err) {
        return res.status(400).send(err);
    }
});

// Retrieve all reviews for a beer
router.get('/:beerId', async (req, res) => {
    try {
        const reviews = await Review.find({ beer: req.params.beerId }).populate({
            path: 'reviewer',
            select: '_id name avatar',
        });
        if (!reviews) return res.status(404).send();

        res.status(200).send(reviews);
    } catch (err) {
        return res.status(400).send(err);
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
            .select('_id name surname email darkMode avatar avatarId')
            .populate(populateParams);
        if (!user) return res.status(404).send();

        // Delete review
        const review = await Review.findOneAndRemove({ _id: reviewId });
        if (!review) return res.status(404).send();

        // Update beer
        const beer = await Beer.findOne({ _id: review.beer }).populate({ path: 'brewery' });
        if (!beer) return res.status(404).send();

        beer.sumOfAllRatings = +beer.sumOfAllRatings - +review.rating;
        beer.totalNumberOfRatings = +beer.totalNumberOfRatings - 1;
        if (beer.sumOfAllRatings >= 0 && beer.totalNumberOfRatings > 0) {
            beer.averageRating = averageRound(+beer.sumOfAllRatings, +beer.totalNumberOfRatings, 1);
        } else {
            beer.averageRating = 0;
        }

        await beer.save((err) => {
            if (err) return res.status(400).send(err);
        });

        // Remove pic from cloudinary
        if (review.picId && review.picId.length > 0) {
            await cloud.deletePic(review.picId);
        }

        res.status(200).send({ user, beer });
    } catch (err) {
        return res.status(400).send(err);
    }
});

module.exports = router;
