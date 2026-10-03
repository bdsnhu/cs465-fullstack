# Travlr Getaways – Module Five

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
