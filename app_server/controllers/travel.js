var fs = require('fs');

/* GET travel view */
const travel = (req, res) => {
    // Read the trips data from the JSON file
    var trips = JSON.parse(fs.readFileSync('./data/trips.json', 'utf8'));

    // Pass the trips data to the handlebars view
    res.render('travel', { title: 'Travlr Getaways', trips: trips });
};

module.exports = {
    travel
};
