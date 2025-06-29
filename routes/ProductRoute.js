const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload } = require('../middleware/Multer');

router.get('/', productController.getAll);
router.post('/', upload.single('media'), productController.create);
router.get('/:id', productController.getOne);
router.put('/:id', upload.single('media'), productController.update);
router.delete('/:id', productController.delete);

module.exports = router;