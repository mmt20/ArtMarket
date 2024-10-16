const express = require('express');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Define a basic route
app.get('/', (req, res) => {
  res.send('Hello from Express on Vercel!');
});

// Define a sample API route
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello, this is a message from the API!' });
});

// Export the Express app for Vercel to use as a serverless function
module.exports = app;
