
WDDM130 Lab 7

This continues the submitted Lab 6 ticket order form and adds:
- custom validation for tickets
- custom lunch rule
- MongoDB persistence with Mongoose
- a /submissions page that lists saved records

Routes:
- GET /
- POST /submit
- GET /submissions

Run locally:
1. Make sure MongoDB is running
2. npm install
3. node app.js
4. Open http://localhost:3000

Mongo:
- Local default: mongodb://127.0.0.1:27017/lab7DB
- Deployed: set MONGODB_URI in Vercel to your MongoDB Atlas connection string
