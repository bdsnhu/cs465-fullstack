// Route/controller smoke tests that run WITHOUT MongoDB.
// The Mongoose model and DB module are replaced with in-memory stand-ins, so this
// exercises the real Express app, the real routes and the real controllers.
// Real end-to-end testing against MongoDB is done with Postman (see postman/).
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-for-unit-tests';

const seed = require('../data/trips.json');
let failDb = false;
let store;                       // in-memory "collection", reset before every test
const resetStore = () => { store = seed.map(t => ({ ...t })); };
resetStore();

const REQUIRED = ['code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description'];
const validate = (doc) => {
    const missing = REQUIRED.filter(f => doc[f] === undefined || doc[f] === '');
    if (missing.length) {
        const err = new Error('validation failed');
        err.name = 'ValidationError';
        err.errors = Object.fromEntries(missing.map(f => [f, { message: `${f} is required` }]));
        throw err;
    }
};
const q = (fn) => ({ exec: async () => { if (failDb) throw new Error('simulated database failure'); return fn(); } });

// Stand-in for the Mongoose model: find / findOne / create / findOneAndUpdate / findOneAndDelete
const fakeTrip = {
    find: (filter = {}) => q(() => store.filter(t => !filter.code || t.code === filter.code)),
    findOne: (filter = {}) => q(() => store.find(t => t.code === filter.code) || null),
    create: async (data) => {
        if (failDb) throw new Error('simulated database failure');
        validate(data);
        store.push({ ...data });
        return data;
    },
    findOneAndUpdate: (filter, data) => q(() => {
        const i = store.findIndex(t => t.code === filter.code);
        if (i < 0) return null;
        const merged = { ...store[i], ...data };
        validate(merged);
        store[i] = merged;
        return merged;
    }),
    findOneAndDelete: (filter) => q(() => {
        const i = store.findIndex(t => t.code === filter.code);
        return i < 0 ? null : store.splice(i, 1)[0];
    })
};
const stub = (rel, exports) => {
    const id = require.resolve(path.join('..', rel));
    require.cache[id] = { id, filename: id, loaded: true, exports };
};
stub('app_api/models/db.js', {});
stub('app_api/models/travlr.js', fakeTrip);

// Stand-in for the User model (real hashing logic is reused from the real schema methods)
const crypto = require('crypto');
let users = [];
class FakeUser {
    constructor() { this._id = 'u' + (users.length + 1); }
    setPassword(pw) {
        this.salt = crypto.randomBytes(16).toString('hex');
        this.hash = crypto.pbkdf2Sync(pw, this.salt, 1000, 64, 'sha512').toString('hex');
    }
    validPassword(pw) {
        const h = crypto.pbkdf2Sync(pw, this.salt, 1000, 64, 'sha512');
        const s = Buffer.from(this.hash, 'hex');
        return s.length === h.length && crypto.timingSafeEqual(s, h);
    }
    generateJWT() {
        return jwt.sign({ _id: this._id, email: this.email, name: this.name },
            process.env.JWT_SECRET, { expiresIn: '1h' });
    }
    async save() { if (failDb) throw new Error('simulated database failure'); users.push(this); return this; }
}
FakeUser.findOne = (f = {}) => q(() => users.find(u => u.email === f.email) || null);
stub('app_api/models/user.js', FakeUser);

const app = require('../app');
let server, base;
test.before(async () => {
    server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test.beforeEach(() => { resetStore(); users = []; });

const validToken = jwt.sign({ _id: 'u0', email: 'admin@travlr.test', name: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const call = async (method, p, payload, token) => {
    const opts = { method, headers: { Accept: 'application/json' } };
    // Write calls to /api/trips carry a valid admin token by default; pass `false` to send none
    if (token === undefined && method !== 'GET' && p.startsWith('/api/trips')) token = validToken;
    if (token) opts.headers.Authorization = `Bearer ${token}`;
    if (payload !== undefined) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(payload);
    }
    const res = await fetch(base + p, opts);
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, type: res.headers.get('content-type'), headers: res.headers, body };
};
const get = (p) => call('GET', p);
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

// ---------- Module 6: POST / PUT / DELETE ----------
const newTrip = {
    code: 'TESTR270301', name: 'Test Reef', length: '3 nights / 4 days',
    start: '2027-03-01', resort: 'Test Bay, 3 stars', perPerson: '599.00',
    image: 'images/reef3.jpg', description: '<p>A test trip.</p>'
};

test('POST /api/trips adds a trip and returns 201 + the trip', async () => {
    const r = await call('POST', '/api/trips', newTrip);
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.body.code, 'TESTR270301');
    assert.strictEqual((await get('/api/trips')).body.length, 4);
});

test('POST /api/trips with missing fields returns 400 and lists the errors', async () => {
    const r = await call('POST', '/api/trips', { code: 'BAD1', name: 'Incomplete' });
    assert.strictEqual(r.status, 400);
    assert.ok(r.body.errors.length > 0);
    assert.strictEqual((await get('/api/trips')).body.length, 3);   // nothing was stored
});

test('POST /api/trips with a duplicate code returns 409', async () => {
    const r = await call('POST', '/api/trips', { ...newTrip, code: 'GALR261114' });
    assert.strictEqual(r.status, 409);
    assert.strictEqual((await get('/api/trips')).body.length, 3);
});

test('PUT /api/trips/:tripCode updates the trip and returns 200', async () => {
    const r = await call('PUT', '/api/trips/GALR261114', { ...seed[0], name: 'Gale Reef Deluxe', perPerson: '899.00' });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.name, 'Gale Reef Deluxe');
    const check = await get('/api/trips/GALR261114');
    assert.strictEqual(check.body[0].perPerson, '899.00');
});

test('PUT /api/trips/:tripCode returns 404 for an unknown code', async () => {
    const r = await call('PUT', '/api/trips/NOPE', newTrip);
    assert.strictEqual(r.status, 404);
});

test('PUT /api/trips/:tripCode returns 400 when a required field is blanked', async () => {
    const r = await call('PUT', '/api/trips/GALR261114', { ...seed[0], name: '' });
    assert.strictEqual(r.status, 400);
});

test('PUT /api/trips/:tripCode cannot take another trip\'s code (409)', async () => {
    const r = await call('PUT', '/api/trips/GALR261114', { ...seed[0], code: 'DAWR261215' });
    assert.strictEqual(r.status, 409);
});

test('DELETE /api/trips/:tripCode removes the trip', async () => {
    const r = await call('DELETE', '/api/trips/GALR261114');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.code, 'GALR261114');
    assert.strictEqual((await get('/api/trips')).body.length, 2);
    assert.strictEqual((await get('/api/trips/GALR261114')).status, 404);
});

test('DELETE /api/trips/:tripCode returns 404 for an unknown code', async () => {
    assert.strictEqual((await call('DELETE', '/api/trips/NOPE')).status, 404);
});

test('write endpoints return 500 JSON when the database fails', async () => {
    failDb = true;
    try {
        assert.strictEqual((await call('POST', '/api/trips', newTrip)).status, 500);
        assert.strictEqual((await call('PUT', '/api/trips/GALR261114', seed[0])).status, 500);
        assert.strictEqual((await call('DELETE', '/api/trips/GALR261114')).status, 500);
    } finally { failDb = false; }
});

test('CORS: preflight and responses allow the Angular admin origin and all verbs', async () => {
    const pre = await fetch(base + '/api/trips/GALR261114', { method: 'OPTIONS' });
    assert.strictEqual(pre.status, 204);
    assert.strictEqual(pre.headers.get('access-control-allow-origin'), 'http://localhost:4200');
    assert.match(pre.headers.get('access-control-allow-methods'), /PUT/);
    assert.match(pre.headers.get('access-control-allow-methods'), /DELETE/);
    const r = await get('/api/trips');
    assert.strictEqual(r.headers.get('access-control-allow-origin'), 'http://localhost:4200');
});

test('/travel image paths work whether stored as "reef1.jpg" or "images/reef1.jpg"', async () => {
    await call('POST', '/api/trips', { ...newTrip, image: 'reef3.jpg' });
    const r = await get('/travel');
    assert.match(r.body, /src="\/images\/reef1\.jpg"/);   // seeded form: images/reef1.jpg
    assert.match(r.body, /src="\/images\/reef3\.jpg"/);   // admin form: reef3.jpg
});

test('PUT /api/trips/:tripCode on an unknown code is 404 even if the body carries an existing code', async () => {
    const r = await call('PUT', '/api/trips/NOPE', { ...seed[0] });   // body code GALR261114 exists
    assert.strictEqual(r.status, 404);
});


// ---------- Module 7: security ----------
const user = { name: 'Test Admin', email: 'admin@travlr.test', password: 'Admin#12345' };
const register = (u = user) => call('POST', '/api/register', u);
const login = (b) => call('POST', '/api/login', b);

test('POST /api/register creates a user and returns 201 + a JWT that verifies', async () => {
    const r = await register();
    assert.strictEqual(r.status, 201);
    const payload = jwt.verify(r.body.token, process.env.JWT_SECRET);
    assert.strictEqual(payload.email, user.email);
    assert.strictEqual(payload.name, user.name);
    assert.ok(payload.exp > payload.iat);
    assert.ok(!('hash' in payload) && !('salt' in payload));
});

test('register stores a salted hash, never the plain password', async () => {
    await register();
    assert.ok(users[0].salt && users[0].hash);
    assert.notStrictEqual(users[0].hash, user.password);
    assert.ok(!JSON.stringify(users[0]).includes(user.password));
});

test('POST /api/register validates input (400) and rejects duplicate email (409)', async () => {
    assert.strictEqual((await register({ email: 'a@b.c', password: 'Password1' })).status, 400);
    assert.strictEqual((await register({ ...user, password: 'short' })).status, 400);
    assert.strictEqual((await register()).status, 201);
    assert.strictEqual((await register()).status, 409);
});

test('POST /api/login with correct credentials returns 200 + a JWT', async () => {
    await register();
    const r = await login({ email: user.email, password: user.password });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(jwt.verify(r.body.token, process.env.JWT_SECRET).email, user.email);
});

test('POST /api/login is case-insensitive on email', async () => {
    await register();
    assert.strictEqual((await login({ email: 'ADMIN@Travlr.Test', password: user.password })).status, 200);
});

test('POST /api/login with wrong password or unknown email returns 401 (same message)', async () => {
    await register();
    const bad = await login({ email: user.email, password: 'wrong-password' });
    const none = await login({ email: 'nobody@travlr.test', password: user.password });
    assert.strictEqual(bad.status, 401);
    assert.strictEqual(none.status, 401);
    assert.strictEqual(bad.body.message, none.body.message);
    assert.strictEqual(bad.body.token, undefined);
});

test('POST /api/login with missing fields returns 400', async () => {
    assert.strictEqual((await login({ email: user.email })).status, 400);
    assert.strictEqual((await login({ password: 'x' })).status, 400);
    assert.strictEqual((await login({})).status, 400);
});

test('a token from /api/login unlocks the protected endpoints end to end', async () => {
    await register();
    const { body } = await login({ email: user.email, password: user.password });
    assert.strictEqual((await call('POST', '/api/trips', newTrip, body.token)).status, 201);
    assert.strictEqual((await call('PUT', '/api/trips/TESTR270301', { ...newTrip, name: 'Renamed' }, body.token)).status, 200);
    assert.strictEqual((await call('DELETE', '/api/trips/TESTR270301', undefined, body.token)).status, 200);
});

test('reads stay public: GET /api/trips and /api/trips/:code need no token', async () => {
    assert.strictEqual((await get('/api/trips')).status, 200);
    assert.strictEqual((await get('/api/trips/GALR261114')).status, 200);
});

test('POST/PUT/DELETE with NO token return 401 and change nothing', async () => {
    assert.strictEqual((await call('POST', '/api/trips', newTrip, false)).status, 401);
    assert.strictEqual((await call('PUT', '/api/trips/GALR261114', { ...seed[0], name: 'Hacked' }, false)).status, 401);
    assert.strictEqual((await call('DELETE', '/api/trips/GALR261114', undefined, false)).status, 401);
    assert.strictEqual(store.length, 3);
    assert.strictEqual(store.find(t => t.code === 'GALR261114').name, 'Gale Reef');
});

test('a tampered token returns 401', async () => {
    const t = validToken.slice(0, -1) + (validToken.endsWith('A') ? 'B' : 'A');
    assert.strictEqual((await call('POST', '/api/trips', newTrip, t)).status, 401);
    assert.strictEqual(store.length, 3);
});

test('a token signed with the wrong secret returns 401', async () => {
    const forged = jwt.sign({ email: 'evil@x.y' }, 'some-other-secret', { expiresIn: '1h' });
    assert.strictEqual((await call('DELETE', '/api/trips/GALR261114', undefined, forged)).status, 401);
    assert.strictEqual(store.length, 3);
});

test('an expired token returns 401', async () => {
    const expired = jwt.sign({ email: 'a@b.c' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const r = await call('PUT', '/api/trips/GALR261114', seed[0], expired);
    assert.strictEqual(r.status, 401);
    assert.match(r.body.message, /expired/i);
});

test('a malformed Authorization header returns 401 (no Bearer scheme / no token / garbage)', async () => {
    for (const header of ['Basic abc', 'Bearer', 'Bearer ', validToken, 'Bearer not.a.jwt', 'Bearer a b']) {
        const res = await fetch(base + '/api/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: header },
            body: JSON.stringify(newTrip)
        });
        assert.strictEqual(res.status, 401, `header "${header}" should be rejected`);
    }
    assert.strictEqual(store.length, 3);
});

test('an unsigned (alg: none) token is rejected', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ email: 'evil@x.y' })}.`;
    assert.strictEqual((await call('POST', '/api/trips', newTrip, none)).status, 401);
});

test('login/register database failure returns 500 JSON', async () => {
    failDb = true;
    try {
        assert.strictEqual((await register()).status, 500);
        assert.strictEqual((await login({ email: user.email, password: user.password })).status, 500);
    } finally { failDb = false; }
});

test('CORS allows the Authorization header', async () => {
    const pre = await fetch(base + '/api/trips', { method: 'OPTIONS' });
    assert.match(pre.headers.get('access-control-allow-headers'), /Authorization/);
});
