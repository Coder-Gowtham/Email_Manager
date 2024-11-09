// elasticsearchClient.js
const { Client } = require('@elastic/elasticsearch');
const dotenv = require('dotenv');
const {config} = require('../constants/environConfig')

// Load environment variables from .env file
dotenv.config();

const client = new Client({
    node: process.env.ELASTICSEARCH_URL || 'https://localhost:9200',
    auth: {
        username: config.ELASTICSEARCH_USERNAME || 'elastic',
        password: config.ELASTICSEARCH_PASSWORD || 'elastic@123',
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Export the client
module.exports = client;
