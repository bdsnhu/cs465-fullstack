const express = require('express');
const router = express.Router();

const tripsController = require('../controllers/trips');

// All routes below are mounted under /api in app.js

// Collection of all trips: list them (GET) or add one (POST)
router
    .route('/trips')
    .get(tripsController.tripsList)
    .post(tripsController.tripsAddTrip);

// A single trip, selected by its trip code (e.g. /api/trips/GALR261114):
// read (GET), update (PUT) or remove (DELETE)
router
    .route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode)
    .put(tripsController.tripsUpdateTrip)
    .delete(tripsController.tripsDeleteTrip);

module.exports = router;
