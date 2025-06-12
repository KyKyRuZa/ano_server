const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const staffController = require('../controllers/staffController');

router.post('/', upload.single('photo'), staffController.createStaff);
router.get('/', staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);
router.put('/:id', upload.single('photo'), staffController.updateStaff);
router.patch('/:id', upload.single('photo'), staffController.partialUpdateStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
