const express = require('express');
const { body } = require('express-validator');
const { updateRole, updateUser } = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Only ADMIN can change roles
router.put('/:userId/role', auth, authorize('ADMIN'), [
  body('role').isIn(['ADMIN','HR','MANAGER','EMPLOYEE'])
], updateRole);

// Update basic user fields (admin only)
router.put('/:userId', auth, authorize('ADMIN'), [
  body('email').optional().isEmail(),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('department').optional().isString()
], updateUser);

// Delete user (admin only)
router.delete('/:userId', auth, authorize('ADMIN'), async (req, res, next) => {
  // delegate to controller
  try {
    const { deleteUser } = require('../controllers/userController');
    return deleteUser(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
