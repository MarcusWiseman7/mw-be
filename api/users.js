const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const { ObjectId } = require('mongodb');
const { userSelect } = require('../utils/vars');
const { mongoose } = require('../db/mongoose');

const { bjUser } = require('../models/brewfoam/user');

let User;

const router = express.Router();

router.use(function (req, res, next) {
    User = req.hostname == 'localhost' ? bjUser : null;
    next();
});

// Nodemailer transport
const smtpTransport = nodemailer.createTransport({
    host: 'smtp.office365.com',
    auth: { user: 'no-reply.beerjournal@outlook.com', pass: process.env.BJ_EMAIL_PASS },
});

router.get('/allUsers', async (req, res) => {
    try {
        const users = await User.find({}, userSelect);
        if (!users) res.status(404).send({ statusCode: -1, message: 'No users found' });

        res.status(200).send({ statusCode: 1, users });
    } catch (err) {
        res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.post('/checkDB', async (req, res) => {
    try {
        const user = await User.findOne(req.body);
        if (user) return res.status(200).send({ statusCode: -1, message: 'This already exists' });
        res.status(200).send({ statusCode: 1, message: 'This is free to use, not in DB yet' });
    } catch (err) {
        res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.post('/addNewUser', async (req, res) => {
    try {
        const testUser = await User.findOne({ email: req.body.email });
        if (testUser) return res.status(403).send({ statusCode: -1, message: 'Email already exists' });

        const user = await new User(req.body);
        await user.save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err });
        });

        res.status(200).send({ statusCode: 1, message: 'New user added' });
    } catch (err) {
        res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.post('/forgotPassword', async (req, res) => {
    try {
        const token = crypto.randomBytes(20).toString('hex');
        const email = req.body.email;
        const baseURL = req.body.baseURL;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send({ statusCode: -1, message: 'No user found with that email' });

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;

        await user.save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err });
        });

        const mailOptions = {
            to: email,
            from: 'Password Reset <no-reply.beerjournal@outlook.com>',
            subject: 'BrewFoam Password Reset',
            text:
                `Hello ${user.displayName || user.name}, \n\n` +
                'You are receiving this email because you have requested to reset your BrewFoam password.\n\n' +
                'Please click on the following link, or paste it into your browser to complete the process:\n\n' +
                `${baseURL}/reset/${token} \n\n` +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n\n' +
                'Best regards, \n\n' +
                'BrewFoam support team',
        };

        smtpTransport.sendMail(mailOptions, (err) => {
            if (err)
                return res.status(412).send({
                    statusCode: -1,
                    smtpTransportError: err,
                    message: 'Error sending reset password token to email',
                });
        });

        res.status(200).send({ statusCode: 1 });
    } catch (err) {
        res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.post('/setCookie', async (req, res) => {
    try {
        const name = req.body.name;
        const value = req.body.value;
        const expires = req.body.expires;
        console.log('name :>> ', name);
        console.log('value :>> ', value);
        console.log('expires :>> ', expires);

        res.status(200).cookie(name, value, { expires, httpOnly: true });
    } catch (err) {
        res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.delete('/deleteUser/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).send({ statusCode: -1, message: 'User not found' });
        res.status(200).send({ statusCode: 1, message: 'User has been deleted' });
    } catch (err) {
        res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.patch('/resetPassword', async (req, res) => {
    try {
        const token = req.body.token;
        const password = req.body.password;
        const resetToken = crypto.randomBytes(20).toString('hex');

        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) return res.status(404).send({ statusCode: -1, message: 'No user found with that email' });

        user.password = password;
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now();

        await user.save((err) => {
            if (err) return res.status(400).send({ statusCode: -1, dbSaveError: err });
        });

        res.status(200).send({ statusCode: 1, email: user.email });
    } catch (err) {
        res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.patch('/changePassword', async (req, res) => {
    try {
        const id = req.body.id;
        if (!ObjectId.isValid(id)) return res.status(404).send({ statusCode: -1, message: 'Invalid id' });
        const user = await User.findById(id);

        if (user && bcrypt.compareSync(req.body.currentPassword, user.password)) {
            user.password = req.body.newPassword;

            await user.save((err) => {
                if (err) return res.status(400).send({ statusCode: -1, message: 'User save to DB error' });
            });

            return res.status(200).send({ statusCode: 1, message: 'Password has been changed' });
        }

        res.status(401).send({ statusCode: -1, message: 'Password does not match' });
    } catch (err) {
        res.status(400).send({ statusCode: -1, catchError: err });
    }
});

router.patch('/updateUser/:id', async (req, res) => {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(404).send();

    try {
        const user = await User.findByIdAndUpdate({ _id: id }, { $set: req.body }, { new: true }).select(userSelect);

        if (!user) return res.status(404).send({ statusCode: -1, message: 'User not found' });
        else return res.status(200).send({ statusCode: 1, user });
    } catch (err) {
        return res.status(400).send({ statusCode: -1, catchError: err });
    }
});

module.exports = router;
