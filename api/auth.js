const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { userSelect } = require('../utils/variables');
const { mongoose } = require('../db/mongoose');
const { User } = require('../models/user');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send();

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            return res.status(401).send();
        }

        const token = jwt.sign({ email, date: new Date() }, 'Its i.p.a. not ipa', {
            expiresIn: '1d',
        });

        user.loginToken = token;
        await user.save((err) => {
            if (err) return res.status(400).send(err);
        });

        res.status(200).json({ token });
    } catch (err) {
        return res.status(400).send(err);
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        if (req.body.id) {
            const user = await User.findOneAndUpdate(
                { _id: req.body.id },
                { $set: { loginToken: new Date() } },
                { new: true }
            );
            if (!user) return res.status(404).send();
        }

        res.status(200).send();
    } catch (err) {
        return res.status(404).send(err);
    }
});

// Get user
router.get('/user', async (req, res) => {
    try {
        const user = await User.findOne({ loginToken: req.headers.authorization.substring(7) }, userSelect);

        if (!user) return res.status(404).send();

        res.status(200).json({ user });
    } catch (err) {
        return res.status(400).send(err);
    }
});

module.exports = router;
