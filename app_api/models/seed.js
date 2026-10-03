// Bring in the DB connection and the Trip schema
const Mongoose = require('./db');
const Trip = require('./travlr');

// Read seed data from json file
const fs = require('fs');
const path = require('path');
const trips = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'trips.json'), 'utf8')
);

// Delete any existing records, then insert seed data
const seedDB = async () => {
    const connected = await Mongoose.ready;
    if (!connected) {
        throw new Error('Could not connect to MongoDB - is mongod running?');
    }
    await Trip.deleteMany({});
    const inserted = await Trip.insertMany(trips);
    console.log(`Seeded ${inserted.length} trips into the 'trips' collection`);
};

// Close the MongoDB connection and exit
seedDB()
    .then(async () => {
        await Mongoose.connection.close();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error('Seeding failed: ', err.message);
        await Mongoose.connection.close().catch(() => {});
        process.exit(1);
    });
