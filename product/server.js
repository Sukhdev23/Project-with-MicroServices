require('dotenv').config(); // Load environment variables before importing other modules
const app = require('./src/app');
const connectDB = require('./src/db/db');
const {connect} =require('./src/broker/broker')

connectDB();
connect();

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});