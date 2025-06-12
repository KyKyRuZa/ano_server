const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const programController = require('../controllers/programController');

router.post('/', upload.single('file'), programController.createProgram);
router.get('/', programController.getAllPrograms);
router.get('/:id', programController.getProgramById);
router.put('/:id', upload.single('file'), programController.updateProgram);
router.patch('/:id', upload.single('file'), programController.partialUpdateProgram);
router.delete('/:id', programController.deleteProgram);

module.exports = router;
