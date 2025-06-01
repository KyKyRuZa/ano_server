const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

// Создать сотрудника
router.post('/', staffController.createStaff);
// Получить всех сотрудников
router.get('/', staffController.getAllStaff);

// Получить сотрудника по ID
router.get('/:id', staffController.getStaffById);

// Обновить сотрудника
router.put('/update/:id', staffController.updateStaff);

// Частично обновить сотрудника
router.patch('/:id', staffController.partialUpdateStaff);

// Удалить сотрудника
router.delete('/:id', staffController.deleteStaff);

module.exports = router;