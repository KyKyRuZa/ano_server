const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const projectController = require('../controllers/projectController');

router.post('/', upload.single('media_path'), projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', upload.single('media_path'), projectController.updateProject); 
router.patch('/:id', upload.single('media_path'), projectController.partialUpdateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
