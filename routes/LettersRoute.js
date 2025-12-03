const express = require('express');
const router = express.Router();
const letterController = require('../controllers/letterController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, handleMulterErrors, validateUploadedFiles } = require('../middleware/Multer');

router.get('/', letterController.getAll);
router.get('/stats', letterController.getStats);
router.get('/:id', letterController.getOne);
router.post(
    '/',
    authMiddleware,
    upload.single('image'),
    handleMulterErrors,
    validateUploadedFiles,
    letterController.create
);
router.put(
    '/:id',
    authMiddleware,
    upload.single('image'),
    handleMulterErrors,
    letterController.update
);
router.delete('/:id', authMiddleware, letterController.delete);

module.exports = router;