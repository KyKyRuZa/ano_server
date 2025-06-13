const express = require('express');
const router = express.Router();
const programController = require('../controllers/ProgramController');
const { upload } = require('../middleware/Multer');

router.get('/', programController.getAll);
router.post('/', upload.single('media'), programController.create);
router.get('/:id', programController.getOne);
router.put('/:id', upload.single('media'), programController.update);
router.delete('/:id', programController.delete);

module.exports = router;