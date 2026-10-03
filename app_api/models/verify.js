// Reads the trips back out of MongoDB with Mongoose and prints them as JSON.
// Run with: npm run verify
const Mongoose = require('./db');
const Trip = require('./travlr');

const verify = async () => {
    const connected = await Mongoose.ready;
    if (!connected) {
        throw new Error('Could not connect to MongoDB - is mongod running?');
    }
    const trips = await Trip.find({}).lean().exec();
    console.log(JSON.stringify(trips, null, 2));
    console.log(`\n${trips.length} trip(s) returned`);
};

verify()
    .then(async () => {
        await Mongoose.connection.close();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error('Verify failed: ', err.message);
        await Mongoose.connection.close().catch(() => {});
        process.exit(1);
    });
