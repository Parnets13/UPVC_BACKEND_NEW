const express = require('express');
const {
  getOptions, createOption, updateOption, deleteOption
} = require('../../controllers/Admin/optionController');
const authenticateAdmin = require('./../../middlewares/adminAuth');

const router = express.Router();


router.get('/', getOptions);
router.use(authenticateAdmin);
router.post('/', createOption);
router.put('/:id', updateOption);
router.delete('/:id', deleteOption);

module.exports = router;
