// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/registerController');
const { loginUser } = require('../controllers/loginController');
const { connectOutlook, handleCallback } = require('../business-logic/authBusiness');
const { fetchEmailElasticController } = require('../controllers/fetchEmailElasticController')

let users = [];

// Register Route
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/auth/callback', handleCallback)
router.get('/auth/outlook', connectOutlook);
router.get('/fetchEmailElastic', fetchEmailElasticController);

// Export the router
module.exports = router;
