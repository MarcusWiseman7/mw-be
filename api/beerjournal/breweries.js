const express = require('express');

const { mongoose } = require('../../db/mongoose');
const { Brewery } = require('../../models/beerjournal/brewery');
const { bjBrewerySelect } = require('../../utils/bjVars');

const router = express.Router();

// Create new brewery
router.post('/', async (req, res) => {
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
