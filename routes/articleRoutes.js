const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

router.get('/', articleController.getAll);
router.post('/', articleController.create);
router.get('/:id', articleController.getOne);
router.put('/:id', articleController.update);
router.delete('/:id', articleController.delete);

module.exports = router;