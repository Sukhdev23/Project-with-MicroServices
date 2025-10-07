const express = require('express');
const app = express();
const cookiesParser = require('cookie-parser');
const orderRoutes = require("./routes/order.routes")


app.use(express.json());
app.use(cookiesParser());


app.use("/api/orders", orderRoutes)

module.exports = app;