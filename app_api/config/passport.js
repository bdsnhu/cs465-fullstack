const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

// Local strategy: the user logs in with email + password (stored in our MongoDB).
// The form field that carries the email is called 'email', not the default 'username'.
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (username, password, done) => {
        try {
            const user = await User.findOne({ email: String(username).toLowerCase() }).exec();
            // Same message for "no such user" and "wrong password" so the API
            // does not reveal which email addresses are registered.
            if (!user || !user.validPassword(password)) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));
