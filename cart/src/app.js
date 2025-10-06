const express = require('express');
const app = express();
const cookiesParser = require('cookie-parser');
const cartRoutes = require('./routes/cart.routes.js');

// Core middlewares first
app.use(express.json());
app.use(cookiesParser());

// Routes
app.use('/api/cart', cartRoutes);

module.exports = app;