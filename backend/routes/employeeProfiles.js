const express = require('express');
const {
  getProfile,
  updateProfile,
  getAllProfiles
} = require('../controllers/employeeProfileController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);
router.get('/', auth, authorize('HR', 'ADMIN'), getAllProfiles);

module.exports = router;