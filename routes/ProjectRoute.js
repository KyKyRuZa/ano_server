const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
const { upload } = require('../middleware/Multer');

router.get('/', projectController.getAll);
router.post('/', upload.single('media'), projectController.create);
router.get('/:id', projectController.getOne);
router.put('/:id', upload.single('media'), projectController.update);
router.delete('/:id', projectController.delete);

module.exports = router;