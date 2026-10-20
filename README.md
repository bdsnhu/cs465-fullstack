# cs465-fullstack
CS-465 Full Stack Development with MEAN
Ben Douglas
10-20-2026
Module Eight Journal
Architecture
Compare and contrast the types of frontend development used

This project used three frontend approaches, and each fit a different job.

Express with HTML (Handlebars templates) renders pages on the server. Express fetches data, fills in a template, and sends finished HTML to the browser. It is simple, fast on first load, and good for SEO, which makes it a good fit for the public customer pages (home, travel, rooms, meals, news, about, contact). The tradeoff is that every navigation is a full page reload, and the pages are less interactive.

JavaScript running in the browser added behavior on top of those pages. In the customer site this was relatively light, such as fetching and displaying data. It is flexible, but without a framework the code tends to become harder to organize as features grow.

The Angular single-page application loads once and then updates the view dynamically, calling the API for data instead of requesting whole new pages. That makes it feel faster and more app-like, and Angular's components, routing, services, and forms suit the admin side, where an administrator is adding, editing, and deleting trips. The tradeoffs are a heavier initial load, a steeper learning curve, and a build step.

In short, server-rendered Express pages work well for mostly read-only public content, while the SPA works well for interactive, data-heavy workflows.

Why did the backend use a NoSQL MongoDB database?

MongoDB stores data as flexible, JSON-like documents, which matched the rest of the stack. Trip data (name, resort, length, price, description, image) maps naturally to a single document, so there was no need to split it across tables and join it back together. Because JavaScript is used from the browser through Express to the database, data flows between layers with little or no translation. Mongoose gave me schemas and validation on top of that flexibility, and MongoDB is easy to scale and change as requirements evolve, such as adding a field to trips without a migration. For this application's data, which is document-shaped with few complex relationships, MongoDB was a natural choice.

Functionality
How is JSON different from JavaScript, and how does it tie the frontend and backend together?

JavaScript is a programming language. It has logic, functions, variables, and control flow. JSON (JavaScript Object Notation) is only a text-based data format. It has no functions or logic, requires double-quoted keys and strings, and can represent only objects, arrays, strings, numbers, booleans, and null. JSON looks like a JavaScript object literal, but it is a language-independent way to describe data.

JSON is the common language between the layers of this application. The Angular SPA sends requests to the Express API, the API reads from and writes to MongoDB (which stores BSON, a binary form of JSON), and the API responds with JSON. Angular parses that JSON into objects and binds it to the UI. Because each layer speaks JSON, the frontend and backend can be developed and tested independently as long as they agree on the shape of the data.

Instances of refactoring and the benefits of reusable UI components


Moving data access into the API. The customer site originally used hard-coded trip data in static HTML. I refactored it so trips came from MongoDB through the REST API, which removed duplication and made the data a single source of truth.
Separating routes, controllers, and models. Moving logic out of the route files into controllers kept routes readable, and made each piece easier to test and debug.
Angular services. I moved HTTP calls into a trip data service and an authentication service instead of repeating them inside components. Components stayed focused on display, and changes to an endpoint or auth header only had to be made once.
Reusable components. Components such as the trip card and trip listing could be used in multiple places with different data, and the layout was written once.

Reusable UI components cut down on repeated code, keep the interface visually consistent, make changes faster (fix it once and it is fixed everywhere), and make testing easier because each component has a clear, limited responsibility.

Testing
Methods, endpoints, and security in a full stack application

Methods are the HTTP verbs that describe the action being performed: GET retrieves data, POST creates it, PUT (or PATCH) updates it, and DELETE removes it. Endpoints are the URLs the API exposes, such as /api/trips for the collection and /api/trips/:tripCode for a single trip. Together they define the contract between frontend and backend: a method and endpoint pair like GET /api/trips/:tripCode means retrieve this trip.

Testing therefore means checking each method and endpoint combination: that it returns the right data and status codes (200, 201, 400, 401, 404, 500), that it validates bad input, and that it fails gracefully. I used Postman to send requests directly to the API and inspect the JSON responses before relying on them in the UI.

Security adds complexity. Once the add, edit, and delete endpoints required authentication, requests could no longer be tested simply by calling a URL. A login request (POST /api/login) first returns a JSON Web Token (JWT), and that token has to be sent in the Authorization: Bearer <token> header on protected requests. Testing now has to cover several cases: a valid token succeeds, a missing token returns 401, an invalid or expired token is rejected, and public GET endpoints still work without a token. Passwords also have to be hashed and salted rather than stored in plain text. Security also shifts the testing across layers, since the Angular app must store the token, attach it to requests through an HTTP interceptor, and handle expiration by logging the user out. Testing all of those pieces together is what makes secured applications harder to test, but it is also what makes the application trustworthy.

Reflection
How has this course helped me reach my professional goals?

This course took me from separate pieces of web development to building and securing a complete application from end to end. I learned to build a server-rendered site with Express, design a REST API, model data with MongoDB and Mongoose, build an Angular SPA, and protect the admin functions with JWT authentication. I also got practical experience with Git and GitHub, including branching, committing, and pushing work for each module, which mirrors how teams work professionally.

Beyond individual technologies, the most valuable skill was understanding how the layers fit together: how a click in the browser becomes an API request, a database query, and an updated view. That makes me better at debugging across the stack and at making sound architectural decisions. Being able to explain why I picked a given approach, such as SPA versus server rendering or NoSQL versus SQL, and to test and secure what I build, makes me a more marketable candidate for full stack and web developer roles. This course has helped me in reaching my professional goals, because I created software for a client, and hopefully one day I can work for Microsoft or another software company.
