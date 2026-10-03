const Trip = require('../models/travlr'); // Mongoose model for the 'trips' collection

// GET /api/trips - lists all trips
// 200 + JSON array of trips (an empty array if the collection is empty)
// 500 + JSON message if the database call fails
const tripsList = async (req, res) => {
    try {
        const trips = await Trip
            .find({})   // an empty filter returns every document
            .exec();
        return res.status(200).json(trips);
    } catch (err) {
        return res.status(500).json({ message: 'Unable to retrieve trips', error: err.message });
    }
};

// GET /api/trips/:tripCode - returns the trip whose 'code' matches the URL parameter
// 200 + JSON array containing the matching trip
// 404 + JSON message if no trip has that code
// 500 + JSON message if the database call fails
const tripsFindByCode = async (req, res) => {
    try {
        const trips = await Trip
            .find({ code: req.params.tripCode })   // filter by the 'code' field
            .exec();

        if (!trips || trips.length === 0) {
            return res.status(404).json({ message: `Trip with code '${req.params.tripCode}' not found` });
        }
        return res.status(200).json(trips);
    } catch (err) {
        return res.status(500).json({ message: 'Unable to retrieve trip', error: err.message });
    }
};

module.exports = {
    tripsList,
    tripsFindByCode
};
