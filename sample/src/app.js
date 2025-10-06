const express = require('express');
const app = express();
const cookiesParser = require('cookie-parser');


app.use(express.json());
app.use(cookiesParser());

module.exports = app;