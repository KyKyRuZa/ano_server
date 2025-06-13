const express = require('express');
const router = express.Router();
const staffController = require('../controllers/StaffController');
const { upload } = require('../middleware/Multer');

router.get('/', staffController.getAll);
router.post('/', upload.single('media'), staffController.create);
router.get('/:id', staffController.getOne);
router.put('/:id', upload.single('media'), staffController.update);
router.delete('/:id', staffController.delete);

module.exports = router;