const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// A user of the admin site. The plain-text password is never stored:
// only a random per-user salt and the PBKDF2 hash of (password + salt).
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    name:  { type: String, required: true },
    hash:  String,
    salt:  String
});

// Create a new random salt and store the hash of the given password
userSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

// Re-hash the submitted password with the stored salt and compare (constant-time)
userSchema.methods.validPassword = function (password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512');
    const stored = Buffer.from(this.hash, 'hex');
    return stored.length === hash.length && crypto.timingSafeEqual(stored, hash);
};

// Sign a JSON Web Token for this user; it expires one hour after creation
userSchema.methods.generateJWT = function () {
    return jwt.sign(
        { _id: this._id, email: this.email, name: this.name },
        process.env.JWT_SECRET,   // secret lives in .env, never in source control
        { expiresIn: '1h' }
    );
};

const User = mongoose.model('users', userSchema);
module.exports = User;
