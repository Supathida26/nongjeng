const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/create', reportController.createReport);

module.exports = router;