const express = require('express');
const { scrapeImages, getResults } = require('../controllers/mainController');
const router = express.Router();


router.post('/', scrapeImages);
router.post('/getFinalMenu', getResults);

module.exports = router;