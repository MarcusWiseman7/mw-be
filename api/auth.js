const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { userSelect } = require('../utils/bjVars');
const { mongoose } = require('../db/mongoose');

const { bjUser } = require('../models/beerjournal/user');

let User;

const router = express.Router();

router.use(function (req, res, next) {
    User = req.hostname == 'localhost' ? bjUser : null;
    next();
});

router.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const secret = process.env.LOGIN_SECRET;
        const exp = process.env.LOGIN_EXP;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).send({ statusCode: -1, message: 'No user found with this email' });

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            return res.status(401).send({ statusCode: -1, message: 'Password does not match' });
        }

        const token = jwt.sign({ email, date: new Date() }, secret, {
            expiresIn: exp,
        });

        user.loginToken = token;
        await user.save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err });
        });

        res.status(200).json({ token });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.post('/logout', async (req, res) => {
    try {
        if (req.body.id) {
            const user = await User.findOneAndUpdate(
                { _id: req.body.id },
                { $set: { loginToken: new Date() } },
                { new: true }
            );
            if (!user) return res.status(404).send({ statusCode: -1, message: 'No user found' });
        }

        res.status(200).send();
    } catch (err) {
        return res.status(404).send({ statusCode: -1, catchError: err });
    }
});

router.get('/user', async (req, res) => {
    try {
        const user = await User.findOne({ loginToken: req.headers.authorization.substring(7) }, userSelect);
        if (!user) return res.status(404).send({ statusCode: -1, message: 'No user found' });

        res.status(200).json({ user });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

module.exports = router;
