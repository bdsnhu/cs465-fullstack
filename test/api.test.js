// Route/controller smoke tests that run WITHOUT MongoDB.
// The Mongoose model and DB module are replaced with in-memory stand-ins, so this
// exercises the real Express app, the real routes and the real controllers.
// Real end-to-end testing against MongoDB is done with Postman (see postman/).
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const http = require('http');

const seed = require('../data/trips.json');
let failDb = false;

// Stand-in for the Mongoose model: supports Trip.find(filter).exec()
const fakeTrip = {
    find(filter = {}) {
        return {
            exec: async () => {
                if (failDb) throw new Error('simulated database failure');
                return seed.filter(t => !filter.code || t.code === filter.code);
            }
        };
    }
};
const stub = (rel, exports) => {
    const id = require.resolve(path.join('..', rel));
    require.cache[id] = { id, filename: id, loaded: true, exports };
};
stub('app_api/models/db.js', {});
stub('app_api/models/travlr.js', fakeTrip);

const app = require('../app');
let server, base;
test.before(async () => {
    server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const get = async (p) => {
    const res = await fetch(base + p, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, type: res.headers.get('content-type'), body };
};

test('GET /api/trips returns 200 and all trips as JSON', async () => {
    const r = await get('/api/trips');
    assert.strictEqual(r.status, 200);
    assert.match(r.type, /application\/json/);
    assert.strictEqual(r.body.length, 3);
});

test('GET /api/trips/:tripCode returns 200 and the matching trip', async () => {
    const r = await get('/api/trips/GALR261114');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.length, 1);
    assert.strictEqual(r.body[0].name, 'Gale Reef');
});

test('GET /api/trips/:tripCode returns 404 JSON for an unknown code', async () => {
    const r = await get('/api/trips/NOPE');
    assert.strictEqual(r.status, 404);
    assert.match(r.body.message, /not found/i);
});

test('unknown /api path returns a JSON 404', async () => {
    const r = await get('/api/nothing');
    assert.strictEqual(r.status, 404);
    assert.match(r.type, /application\/json/);
});

test('database failure returns 500 JSON from both endpoints', async () => {
    failDb = true;
    try {
        assert.strictEqual((await get('/api/trips')).status, 500);
        assert.strictEqual((await get('/api/trips/GALR261114')).status, 500);
    } finally { failDb = false; }
});

test('/travel page is rendered from API data', async () => {
    const r = await get('/travel');
    assert.strictEqual(r.status, 200);
    assert.match(r.body, /Gale Reef/);
    assert.match(r.body, /href="\/api\/trips\/GALR261114"/);
});

test('/travel page shows an error status when the API fails', async () => {
    failDb = true;
    try {
        const r = await get('/travel');
        assert.strictEqual(r.status, 500);
        assert.match(r.body, /Unable to retrieve trips/);
    } finally { failDb = false; }
});
