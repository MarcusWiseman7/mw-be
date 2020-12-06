const express = require('express');

const { mongoose } = require('../../db/mongoose');
const { Brewery } = require('../../models/beerjournal/brewery');

const router = express.Router();

// Create new brewery
router.post('/', async (req, res) => {
    try {
        const checkBrewery = await Brewery.findOne({ name: req.body.name });
        if (checkBrewery) return res.status(404).send();

        const brewery = await new Brewery(req.body).save((err) => {
            if (err) return res.status(400).send(err);
        });

        res.status(200).send(brewery);
    } catch (err) {
        return res.status(400).send(err);
    }
});

// Retrieve brewery
router.get('/:id', async (req, res) => {
    try {
        const brewery = await Brewery.findOne({ _id: req.params.id });
        if (!brewery) return res.status(404).send();

        res.status(200).send(brewery);
    } catch (err) {
        return res.status(400).send(err);
    }
});

// Update brewery
router.patch('/:id', async (req, res) => {
    try {
        const brewery = await Brewery.findOneAndUpdate({ _id: req.params.id }, { $set: req.body }, { new: true });
        if (!brewery) return res.status(404).send();

        res.status(200).send(brewery);
    } catch (err) {
        return res.status(400).send(err);
    }
});

// Delete brewery
router.delete('/:id', async (req, res) => {
    try {
        const brewery = await Brewery.findOneAndDelete({ _id: req.params.id });
        if (!brewery) return res.status(404).send();

        res.status(200).send();
    } catch (err) {
        return res.status(400).send(err);
    }
});

module.exports = router;
