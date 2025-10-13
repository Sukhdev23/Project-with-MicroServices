require('dotenv').config();
const app = require('./src/app');
const {connect} = require('./src/broker/borker');

const connectDB = require('./src/db/db');

connectDB();
connect();


app.listen(3004, () => {
  console.log('Server is running on port 3004');
});