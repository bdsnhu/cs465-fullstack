const passport = require('passport');
const User = require('../models/user');

const MIN_PASSWORD_LENGTH = 8;

// POST /api/register - create a user and return a JWT
// 201 {token} | 400 missing/short fields | 409 email already registered | 500
const register = async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields required' });
    }
    if (String(password).length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }
    try {
        if (await User.findOne({ email: String(email).toLowerCase() }).exec()) {
            return res.status(409).json({ message: 'That email address is already registered' });
        }
        const user = new User();
        user.name = name;
        user.email = email;
        user.setPassword(String(password));
        await user.save();
        return res.status(201).json({ token: user.generateJWT() });
    } catch (err) {
        return res.status(500).json({ message: 'Unable to register user', error: err.message });
    }
};

// POST /api/login - check credentials with passport and return a JWT
// 200 {token} | 400 missing fields | 401 bad credentials | 500
const login = (req, res) => {
    if (!req.body || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'All fields required' });
    }
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Authentication error', error: err.message });
        }
        if (user) {
            return res.status(200).json({ token: user.generateJWT() });
        }
        return res.status(401).json(info);
    })(req, res);
};

module.exports = { register, login };
