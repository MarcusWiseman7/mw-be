const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const UserSchema = new Schema(
    {
        password: { type: String, trim: true },
        email: { type: String, trim: true, unique: true },
        displayName: { type: String, trim: true, unique: true },
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

const User = mongoose.model('User', UserSchema);

module.exports = { User };
