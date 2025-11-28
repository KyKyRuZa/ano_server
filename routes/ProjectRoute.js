const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, handleMulterErrors, validateUploadedFiles } = require('../middleware/Multer');

router.get('/', projectController.getAll);
router.get('/:id', projectController.getOne);

router.post('/',
    authMiddleware,
    upload.single('media'),
    handleMulterErrors,
    validateUploadedFiles,
    projectController.create
);

router.put('/:id',
    authMiddleware,
    upload.single('media'),
    handleMulterErrors,
    projectController.update
);

router.delete('/:id',
    authMiddleware,
    projectController.delete
);

module.exports = router;