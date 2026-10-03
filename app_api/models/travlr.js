const mongoose = require('mongoose');

// Define the trip schema
// - code and name are indexed for faster retrieval
// - start is stored as a Date (ISO 8601 when serialized to JSON)
// - all fields are required, so an incomplete trip is rejected before it is saved
const tripSchema = new mongoose.Schema({
    code:        { type: String, required: [true, 'Trip code is required'],        index: true },
    name:        { type: String, required: [true, 'Trip name is required'],        index: true },
    length:      { type: String, required: [true, 'Trip length is required'] },
    start:       { type: Date,   required: [true, 'Trip start date is required'] },
    resort:      { type: String, required: [true, 'Resort is required'] },
    perPerson:   { type: String, required: [true, 'Per-person price is required'] },
    image:       { type: String, required: [true, 'Image is required'] },
    description: { type: String, required: [true, 'Description is required'] }
});

// The model name 'trips' maps to the 'trips' collection in the travlr database
const Trip = mongoose.model('trips', tripSchema);

module.exports = Trip;
