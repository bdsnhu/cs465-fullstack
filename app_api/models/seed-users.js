// Creates (or resets) mock admin users for testing authentication.
// Run with:  npm run seed:users
require('dotenv').config();
const Mongoose = require('./db');
const User = require('./user');

const mockUsers = [
    { name: 'Test Admin', email: 'admin@travlr.test', password: 'Admin#12345' },
    { name: 'Second Admin', email: 'second@travlr.test', password: 'Second#12345' }
];

const seedUsers = async () => {
    if (!(await Mongoose.ready)) {
        throw new Error('Could not connect to MongoDB - is mongod running?');
    }
    await User.deleteMany({ email: { $in: mockUsers.map(u => u.email) } });
    for (const m of mockUsers) {
        const user = new User();
        user.name = m.name;
        user.email = m.email;
        user.setPassword(m.password);   // stores salt + hash, never the password
        await user.save();
    }
    console.log(`Seeded ${mockUsers.length} mock users: ${mockUsers.map(u => u.email).join(', ')}`);
};

seedUsers()
    .then(async () => { await Mongoose.connection.close(); process.exit(0); })
    .catch(async (err) => {
        console.error('Seeding users failed: ', err.message);
        await Mongoose.connection.close().catch(() => {});
        process.exit(1);
    });
