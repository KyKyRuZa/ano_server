const express = require('express');
const router = express.Router();
const programController = require('../controllers/ProgramController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, handleMulterErrors, validateUploadedFiles } = require('../middleware/Multer');

router.get('/', programController.getAll);
router.get('/:id', programController.getOne);

router.post('/',
    authMiddleware,
    upload.single('media'),
    handleMulterErrors,
    validateUploadedFiles,
    programController.create
);

router.put('/:id',
    authMiddleware,
    upload.single('media'),
    handleMulterErrors,
    programController.update
);

router.delete('/:id',
    authMiddleware,
    programController.delete
);

module.exports = router;