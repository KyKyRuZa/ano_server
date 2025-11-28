const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, handleMulterErrors, validateUploadedFiles } = require('../middleware/Multer');

router.get('/', productController.getAll);
router.get('/:id', productController.getOne);

router.post('/', 
    authMiddleware,
    upload.single('media'),
    handleMulterErrors,
    validateUploadedFiles,
    productController.create
);

router.put('/:id',
    authMiddleware,
    upload.single('media'),
    handleMulterErrors,
    productController.update
);

router.delete('/:id', 
    authMiddleware,
    productController.delete
);

module.exports = router;