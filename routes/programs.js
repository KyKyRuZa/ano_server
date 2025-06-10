const express = require('express');
const router = express.Router();
const programsController = require('../controllers/programController');



router.get('/', programsController.createProgram );
router.get('/:id', programsController.getProgramById);
router.post('/',programsController.updateProgram);
router.patch('/:id', programsController.partialUpdateProgram);
router.delete('/:id', programsController.deleteProgram);

module.exports = router;
