// The Express app server no longer touches the database or the JSON seed file.
// It calls the REST API (/api/trips) and renders whatever JSON comes back.
const options = {
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

/* GET travel view */
const travel = async (req, res) => {
    // Build the endpoint from the incoming request so it works on any host/port
    const tripsEndpoint = `${req.protocol}://${req.get('host')}/api/trips`;

    try {
        const response = await fetch(tripsEndpoint, options);
        const json = await response.json();

        if (!response.ok) {
            // The API answered with an error status (e.g. 500)
            return res.status(response.status).render('travel', {
                title: 'Travlr Getaways',
                trips: [],
                message: (json && json.message) || 'The trips API returned an error'
            });
        }

        let trips = json;
        let message = null;
        if (!(trips instanceof Array)) {
            trips = [];
            message = 'API lookup error';
        } else if (trips.length === 0) {
            message = 'No trips exist in our database!';
        }

        // Accept image values stored as "reef1.jpg" or "images/reef1.jpg" (the admin SPA
        // and the seed data use different forms) and always point at /images/<file>
        trips = trips.map(t => ({
            ...t,
            image: '/images/' + String(t.image || '').replace(/^\/?(images\/)?/, '')
        }));

        res.render('travel', { title: 'Travlr Getaways', trips, message });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

module.exports = {
    travel
};
