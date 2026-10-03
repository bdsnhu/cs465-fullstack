const express = require('express');
const router = express.Router();

const tripsController = require('../controllers/trips');

// All routes below are mounted under /api in app.js

// Collection of all trips
router
    .route('/trips')
    .get(tripsController.tripsList);

// A single trip, selected by its trip code (e.g. /api/trips/GALR261114)
router
    .route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode);

module.exports = router;
