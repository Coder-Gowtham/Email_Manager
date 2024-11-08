// index.js
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
const client = require('./elasticsearchClient'); // Import the client from the new file
const userService = require('./services/userService');
const { config, authConfig } = require('./constants/environConfig');
const session = require('express-session');
const app = express();
app.use(cors({ origin: 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true }));
app.use(express.json());

app.use(session({
    secret: authConfig.CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const createinitiaindices = async () => {
  const indices = ['user_accounts', 'email_messages', 'mailbox_details'];
 await userService.createIndicesService(indices, client).then(result => {
    console.log(`createIndex response || ${JSON.stringify(result)}`);
  }).catch(error => {
    console.error(`Error in index || ${JSON.stringify(error)}`);
    const dbErrorResponse = {
      status: error?.status || STATUS_CODE.DATABASE_ERROR,
      message: "Error executing to database.",
      error: error
    };
    throw dbErrorResponse;
  })
};

createinitiaindices();

app.use('/manager/users', userRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hello, Elasticsearch!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access URL || ${config.BACKEND_URL}`);

});
