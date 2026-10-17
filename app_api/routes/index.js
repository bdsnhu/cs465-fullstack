const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Enable JSON Web Tokens

const tripsController = require('../controllers/trips');
const authController = require('../controllers/authentication');

// Middleware that protects the admin (write) endpoints.
// Expects  Authorization: Bearer <jwt>.  A missing, malformed, tampered or
// expired token is answered with 401 and the request never reaches the controller.
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header required' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
        return res.status(401).json({ message: 'Authorization header must be: Bearer <token>' });
    }

    jwt.verify(parts[1], process.env.JWT_SECRET, (err, verified) => {
        if (err) {
            return res.status(401).json({ message: 'Token validation error: ' + err.message });
        }
        req.auth = verified;   // decoded payload (_id, email, name)
        next();                // only continue once the token has verified
    });
}

// All routes below are mounted under /api in app.js

// Authentication endpoints (public - they are how a user gets a token)
router.route('/register').post(authController.register);
router.route('/login').post(authController.login);

// Collection of all trips: list them (GET, public) or add one (POST, admin only)
router
    .route('/trips')
    .get(tripsController.tripsList)
    .post(authenticateJWT, tripsController.tripsAddTrip);

// A single trip, selected by its trip code (e.g. /api/trips/GALR261114):
// read (GET, public); update (PUT) or remove (DELETE) are admin only
router
    .route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode)
    .put(authenticateJWT, tripsController.tripsUpdateTrip)
    .delete(authenticateJWT, tripsController.tripsDeleteTrip);

module.exports = router;
