const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const UserSchema = new Schema(
    {
        password: { type: String, trim: true },
        email: { type: String, trim: true, unique: true },
        altEmails: [{ type: String, trim: true, unique: true }],
        displayName: { type: String, trim: true, unique: true },
        name: { type: String, trim: true },
        avatarURL: { type: String, trim: true },
        avatarId: { type: String, trim: true },
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
        darkMode: { type: Boolean, default: false },
        tempEmail: { type: String, trim: true },
        tempEmailToken: { type: String },
        gdprApproval: { type: Boolean, default: false },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
        loginToken: { type: String },
    },
    { usePushEach: true }
);

UserSchema.pre('save', function (next) {
    const user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

const bjDB = mongoose.connection.useDb('BJ');
const bjUser = bjDB.model('User', UserSchema);

module.exports = { bjUser };
