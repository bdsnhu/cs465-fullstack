const Trip = require('../models/travlr'); // Mongoose model for the 'trips' collection

// The fields a client may set on a trip (anything else in the body is ignored)
const TRIP_FIELDS = ['code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description'];

// Copy only the known trip fields out of a request body
const pickTripFields = (body = {}) => {
    const out = {};
    TRIP_FIELDS.forEach(f => { if (body[f] !== undefined) out[f] = body[f]; });
    return out;
};

// Turn a Mongoose ValidationError / CastError into a 400 response body
const validationResponse = (err) => {
    const errors = err.errors
        ? Object.values(err.errors).map(e => e.message)
        : [err.message];
    return { message: 'Trip validation failed', errors };
};
const isClientError = (err) => err.name === 'ValidationError' || err.name === 'CastError';

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

// POST /api/trips - adds a new trip using the JSON (or form-encoded) request body
// 201 + the saved trip
// 400 + JSON message if a required field is missing / invalid
// 409 + JSON message if a trip with the same code already exists
// 500 + JSON message if the database call fails
const tripsAddTrip = async (req, res) => {
    try {
        const data = pickTripFields(req.body);

        // Trip codes identify a trip in the URL, so they must be unique
        if (data.code) {
            const existing = await Trip.findOne({ code: data.code }).exec();
            if (existing) {
                return res.status(409).json({ message: `Trip with code '${data.code}' already exists` });
            }
        }

        const trip = await Trip.create(data);   // runs schema validation
        return res.status(201).json(trip);
    } catch (err) {
        if (isClientError(err)) return res.status(400).json(validationResponse(err));
        return res.status(500).json({ message: 'Unable to add trip', error: err.message });
    }
};

// PUT /api/trips/:tripCode - replaces the fields of the trip with that code
// 200 + the updated trip
// 400 + JSON message if validation fails
// 404 + JSON message if no trip has that code
// 409 + JSON message if the update would give the trip a code another trip already uses
// 500 + JSON message if the database call fails
const tripsUpdateTrip = async (req, res) => {
    try {
        const data = pickTripFields(req.body);

        // Changing the code to one that belongs to a different trip is not allowed.
        // Check that the trip being updated exists FIRST, so an unknown trip is always a 404.
        if (data.code && data.code !== req.params.tripCode) {
            const target = await Trip.findOne({ code: req.params.tripCode }).exec();
            if (!target) {
                return res.status(404).json({ message: `Trip with code '${req.params.tripCode}' not found` });
            }
            const clash = await Trip.findOne({ code: data.code }).exec();
            if (clash) {
                return res.status(409).json({ message: `Trip with code '${data.code}' already exists` });
            }
        }

        const trip = await Trip
            .findOneAndUpdate(
                { code: req.params.tripCode },
                data,
                { new: true, runValidators: true }   // return the updated document and validate it
            )
            .exec();

        if (!trip) {
            return res.status(404).json({ message: `Trip with code '${req.params.tripCode}' not found` });
        }
        return res.status(200).json(trip);
    } catch (err) {
        if (isClientError(err)) return res.status(400).json(validationResponse(err));
        return res.status(500).json({ message: 'Unable to update trip', error: err.message });
    }
};

// DELETE /api/trips/:tripCode - removes the trip with that code
// 200 + the deleted trip
// 404 + JSON message if no trip has that code
// 500 + JSON message if the database call fails
const tripsDeleteTrip = async (req, res) => {
    try {
        const trip = await Trip
            .findOneAndDelete({ code: req.params.tripCode })
            .exec();

        if (!trip) {
            return res.status(404).json({ message: `Trip with code '${req.params.tripCode}' not found` });
        }
        return res.status(200).json(trip);
    } catch (err) {
        return res.status(500).json({ message: 'Unable to delete trip', error: err.message });
    }
};

module.exports = {
    tripsList,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip,
    tripsDeleteTrip
};
