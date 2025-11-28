const express = require('express');
const router = express.Router();
const staffController = require('../controllers/StaffController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, handleMulterErrors, validateUploadedFiles } = require('../middleware/Multer');

router.get('/', staffController.getAll);
router.get('/:id', staffController.getOne);

router.post('/',
    authMiddleware,
    upload.single('media'),
    handleMulterErrors,
    validateUploadedFiles,
    staffController.create
);

router.put('/:id',
    authMiddleware,
    upload.single('media'),
    handleMulterErrors,
    staffController.update
);

router.delete('/:id',
    authMiddleware,
    staffController.delete
);

module.exports = router;