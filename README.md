# Travlr Getaways

## Setup
1. Install and start MongoDB locally (default port 27017).
2. `npm install`
3. `npm run seed`   – wipes the `trips` collection and loads `data/trips.json`
4. `npm run verify` – reads the trips back through Mongoose and prints them as JSON
5. `npm start`      – runs the site on http://localhost:3000 (connects to MongoDB on startup)

Set `DB_HOST` to point at a different MongoDB host (default `127.0.0.1`).

## Where things are
| File | Purpose |
|------|---------|
| `app_api/models/db.js` | Mongoose connection module (connection events, error handling, graceful shutdown) |
| `app_api/models/travlr.js` | Trip schema with validation; `code` and `name` indexed; `start` stored as a Date |
| `app_api/models/seed.js` | Seeds the `trips` collection from `data/trips.json` |
| `app_api/models/verify.js` | Queries the collection with Mongoose and prints JSON |
| `data/trips.json` | Seed data (3 trips) |

## Inspecting the data
Open MongoDB Compass, connect to `mongodb://127.0.0.1:27017`, and open the
`travlr` database, then the `trips` collection. It should contain 3 documents.

## Module Five: RESTful API (`app_api`)
The database access code now lives in its own top-level folder, `app_api`, and is exposed
at `/api`. The Express app server (`app_server`) no longer reads the JSON file or touches
MongoDB: its travel controller calls `/api/trips` with `fetch` and renders the result.

| Method | Endpoint | Controller | Responses |
|--------|----------|------------|-----------|
| GET | `/api/trips` | `tripsList` | 200 JSON array of all trips; 500 on DB error |
| GET | `/api/trips/:tripCode` | `tripsFindByCode` | 200 JSON array with the matching trip; 404 if the code is unknown; 500 on DB error |
| any | other `/api/*` | – | 404 JSON `{ "message": "API endpoint not found" }` |

Sample codes: `GALR261114`, `DAWR261215`, `CLAR270121`.

### Testing
* **Postman:** import `postman/travlr-api.postman_collection.json` (base URL `http://localhost:3000`),
  run the app with `npm start`, and run the collection. Each request has assertions on status code and JSON body.
* **Offline smoke tests:** `npm test` runs the real routes/controllers against an in-memory stand-in for the model (no MongoDB needed).

### Layout
```
app_api/        controllers/trips.js, routes/index.js, models/ (db, travlr, seed, verify)
app_server/     controllers, routes, views (calls the API)
```

## Module Six: Angular admin SPA (`app_admin`) + full CRUD API

### Run it (three terminals)
```
npm run seed                    # (Express project root) load the 3 sample trips
npm start                       # Express site + API on http://localhost:3000
cd app_admin && npm install     # first time only
npm start                       # Angular admin SPA on http://localhost:4200  (runs `ng serve`)
```

### API (all under `/api`, CORS allows the admin origin http://localhost:4200)
| Method | Endpoint | Controller | Responses |
|--------|----------|------------|-----------|
| GET | `/api/trips` | `tripsList` | 200 array; 500 |
| POST | `/api/trips` | `tripsAddTrip` | 201 new trip; 400 validation errors; 409 duplicate code; 500 |
| GET | `/api/trips/:tripCode` | `tripsFindByCode` | 200 array with the trip; 404; 500 |
| PUT | `/api/trips/:tripCode` | `tripsUpdateTrip` | 200 updated trip; 400; 404; 409 (code belongs to another trip); 500 |
| DELETE | `/api/trips/:tripCode` | `tripsDeleteTrip` | 200 deleted trip; 404; 500 |

### Angular structure (`app_admin/src/app`)
| Folder / file | Purpose |
|---|---|
| `models/trip.ts` | `Trip` interface matching the API's JSON |
| `services/trip-data.service.ts` | `getTrips`, `getTrip`, `addTrip`, `updateTrip`, `deleteTrip` (HttpClient to `/api/trips`) |
| `trip-listing/` | Loads trips from the service, lays out cards, Add Trip button, handles delete |
| `trip-card/` | Renders one trip; Edit and Delete buttons |
| `add-trip/`, `edit-trip/` | Reactive forms with validation; edit loads the trip from the `/edit-trip/:code` URL |
| `data/trips.ts` | Mock trips used only by the unit tests |
| `app.routes.ts` | `''` listing, `add-trip`, `edit-trip/:code` |

### Testing
* `npm test` (project root): 18 offline API tests (all five endpoints, success + 400/404/409/500 paths, CORS).
* `cd app_admin && npm test` (`ng test`, needs Chrome): 26 Jasmine specs for the service, card, listing, add and edit components, using the mock trips.
* Postman: import `postman/travlr-api.postman_collection.json`, run it in order against a freshly seeded database; it adds, updates and deletes a trip and ends with the database unchanged.


## Module Seven: Security (JWT login for the admin SPA)

### Setup
```
npm install                     # adds jsonwebtoken, passport, passport-local, dotenv
cp .env.example .env            # then set JWT_SECRET to a long random string (.env is git-ignored)
npm run seed                    # trips
npm run seed:users              # mock admin users: admin@travlr.test / Admin#12345 , second@travlr.test / Second#12345
npm start                       # API + site on :3000 (refuses to start without JWT_SECRET)
cd app_admin && npm install && npm start    # admin SPA on :4200
```

### How it works
* **Passwords** are never stored: `app_api/models/user.js` keeps a random 16-byte salt and a PBKDF2-SHA512 hash.
* **Login** (`POST /api/login`) uses Passport's local strategy (`app_api/config/passport.js`) and returns a 1-hour JWT signed with `JWT_SECRET`.
* **Register** (`POST /api/register`) creates a user and returns a JWT (400 for missing fields / password under 8 chars, 409 for a duplicate email).
* **Middleware** `authenticateJWT` (`app_api/routes/index.js`) guards the admin endpoints. Missing, malformed, tampered, wrong-secret or expired tokens get a JSON 401 and never reach the controller.

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/register`, `/api/login` | public |
| GET | `/api/trips`, `/api/trips/:code` | public |
| POST | `/api/trips` | **JWT required** |
| PUT, DELETE | `/api/trips/:code` | **JWT required** |

### Angular changes (`app_admin/src/app`)
| File | Purpose |
|---|---|
| `storage.ts` | injectable `localStorage` token |
| `models/user.ts`, `models/auth-response.ts` | user and token shapes |
| `services/authentication.service.ts` | save/read/remove token (`travlr-token`), `isLoggedIn()` (checks expiry), `login()`, `register()` |
| `services/trip-data.service.ts` | adds `login()` / `register()` API calls |
| `utils/jwt.interceptor.ts` | adds `Authorization: Bearer <token>` to API calls (not login/register, not other hosts) |
| `guards/auth.guard.ts` | `/add-trip` and `/edit-trip/:code` redirect to `/login` when logged out |
| `navbar/`, `login/` | Log In / Log Out nav and email + password login form |
| `trip-card/`, `trip-listing/` | Add / Edit / Delete buttons only shown when logged in |

### Testing
* `npm test` - 37 offline API tests, including register/login, hashing, and 401 for no/tampered/forged/expired/malformed/`alg:none` tokens.
* `postman/travlr-api-module7.postman_collection.json` - run against the live API with MongoDB (19 requests: register, login, protected calls with and without a token, cleanup).
* `cd app_admin && npm test` - Jasmine specs (needs Chrome) for the auth service, interceptor, guard, login, navbar, card and listing.
* Manual front-end check: logged out you see only the trip cards and **Log In**; after logging in you see **Add Trip**, **Edit Trip**, **Delete** and **Log Out**; add/edit/delete then succeed.
