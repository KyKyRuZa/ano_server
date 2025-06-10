const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

router.post('/', programController.create);
router.get('/', programController.getAll);


module.exports = router;