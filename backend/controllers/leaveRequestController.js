const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveType = require('../models/LeaveType');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendLeaveApplicationNotification, sendLeaveReminderNotification, sendLeaveApprovalNotification } = require('../utils/emailService');

const applyLeave = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leaveTypeId, startDate, endDate, isHalfDay, halfDayType, reason } = req.body;
    const userId = req.user.id;

    // Check for overlapping leaves
    const overlapping = await LeaveRequest.findOne({
      userId,
      status: { $in: ['PENDING', 'MANAGER_APPROVED', 'HR_APPROVED'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ message: 'Overlapping leave request exists' });
    }

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (isHalfDay) days = 0.5;

    // Check balance
    const currentYear = start.getFullYear();
    const balance = await LeaveBalance.findOne({ userId, leaveTypeId, year: currentYear });
    const leaveType = await LeaveType.findById(leaveTypeId);

    let isLOP = false;
    if (balance) {
      const available = balance.allocated + balance.carryForward - balance.used - balance.pending;
      if (days > available) {
        if (!leaveType.lopEnabled) {
          return res.status(400).json({ message: 'Insufficient leave balance' });
        }
        isLOP = true;
      }
    } else if (!leaveType.lopEnabled) {
      return res.status(400).json({ message: 'No leave balance found' });
    } else {
      isLOP = true;
    }

    const leaveRequest = new LeaveRequest({
      userId,
      leaveTypeId,
      startDate: start,
      endDate: end,
      days,
      isHalfDay,
      halfDayType,
      reason,
      isLOP
    });

    await leaveRequest.save();

    // Update pending balance
    if (balance && !isLOP) {
      balance.pending += days;
      await balance.save();
    }

    await leaveRequest.populate(['leaveTypeId', 'userId']);
    
    // Send email notification
    await sendLeaveApplicationNotification(leaveRequest);
    
    res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getLeaveRequests = async (req, res) => {
  try {
    const { status, userId, startDate, endDate, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (req.user.role === 'EMPLOYEE') {
      filter.userId = req.user.id;
    } else if (userId) {
      filter.userId = userId;
    }

    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const requests = await LeaveRequest.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('leaveTypeId', 'name color')
      .populate('managerApproval.approvedBy', 'firstName lastName')
      .populate('hrApproval.approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LeaveRequest.countDocuments(filter);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'MANAGER') {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      filter = {
        userId: { $in: teamMembers.map(m => m._id) },
        status: 'PENDING'
      };
    } else if (req.user.role === 'HR' || req.user.role === 'ADMIN') {
      filter.status = { $in: ['PENDING', 'MANAGER_APPROVED'] };
    }

    const requests = await LeaveRequest.find(filter)
      .populate('userId', 'firstName lastName email department')
      .populate('leaveTypeId', 'name color')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const approveReject = async (req, res) => {
  try {
    const { action, comments } = req.body;
    const requestId = req.params.id;

    const leaveRequest = await LeaveRequest.findById(requestId)
      .populate('leaveTypeId')
      .populate('userId');

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (action === 'approve') {
      if (req.user.role === 'MANAGER' && leaveRequest.status === 'PENDING') {
        leaveRequest.status = 'MANAGER_APPROVED';
        leaveRequest.managerApproval = {
          approvedBy: req.user.id,
          approvedAt: new Date(),
          comments
        };
        await sendLeaveApprovalNotification(leaveRequest, `${req.user.firstName} ${req.user.lastName}`, 'Manager');
      } else if ((req.user.role === 'HR' || req.user.role === 'ADMIN')) {
        leaveRequest.status = 'HR_APPROVED';
        leaveRequest.hrApproval = {
          approvedBy: req.user.id,
          approvedAt: new Date(),
          comments
        };
        await sendLeaveApprovalNotification(leaveRequest, `${req.user.firstName} ${req.user.lastName}`, 'HR');

        // Update balance
        if (!leaveRequest.isLOP) {
          const balance = await LeaveBalance.findOne({
            userId: leaveRequest.userId._id,
            leaveTypeId: leaveRequest.leaveTypeId._id,
            year: leaveRequest.startDate.getFullYear()
          });

          if (balance) {
            balance.used += leaveRequest.days;
            balance.pending -= leaveRequest.days;
            await balance.save();
          }
        }
      }
    } else if (action === 'reject') {
      leaveRequest.status = 'REJECTED';
      leaveRequest.rejectionReason = comments;

      // Release pending balance
      if (!leaveRequest.isLOP) {
        const balance = await LeaveBalance.findOne({
          userId: leaveRequest.userId._id,
          leaveTypeId: leaveRequest.leaveTypeId._id,
          year: leaveRequest.startDate.getFullYear()
        });

        if (balance) {
          balance.pending -= leaveRequest.days;
          await balance.save();
        }
      }
    }

    await leaveRequest.save();
    res.json({ message: `Leave request ${action}d successfully`, leaveRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const cancelLeave = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.userId.toString() !== req.user.id && !['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({ message: 'Can only cancel pending requests' });
    }

    leaveRequest.status = 'CANCELLED';
    await leaveRequest.save();

    // Release pending balance
    if (!leaveRequest.isLOP) {
      const balance = await LeaveBalance.findOne({
        userId: leaveRequest.userId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: leaveRequest.startDate.getFullYear()
      });

      if (balance) {
        balance.pending -= leaveRequest.days;
        await balance.save();
      }
    }

    res.json({ message: 'Leave request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTeamCalendar = async (req, res) => {
  try {
    let teamMemberIds = [];
    
    // Get team members based on role
    if (req.user.role === 'MANAGER') {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id firstName lastName');
      teamMemberIds = teamMembers.map(m => m._id);
    } else if (['HR', 'ADMIN'].includes(req.user.role)) {
      // For HR/ADMIN, get all active employees
      const allEmployees = await User.find({ isActive: true, role: { $ne: 'ADMIN' } }).select('_id firstName lastName');
      teamMemberIds = allEmployees.map(e => e._id);
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get upcoming leaves (next 90 days)
    const next90Days = new Date();
    next90Days.setDate(next90Days.getDate() + 90);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const teamLeaves = await LeaveRequest.find({
      userId: { $in: teamMemberIds },
      status: { $in: ['MANAGER_APPROVED', 'HR_APPROVED'] },
      $or: [
        { startDate: { $gte: today, $lte: next90Days } },
        { endDate: { $gte: today, $lte: next90Days } },
        { startDate: { $lte: today }, endDate: { $gte: today } }
      ]
    })
    .populate('userId', 'firstName lastName email department')
    .populate('leaveTypeId', 'name color')
    .sort({ startDate: 1 });

    // Get team members info
    const teamMembers = await User.find({ _id: { $in: teamMemberIds } })
      .select('firstName lastName email department role')
      .sort({ firstName: 1 });

    res.json({
      teamMembers,
      leaves: teamLeaves
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const testLeaveReminder = async (req, res) => {
  try {
    const { requestId } = req.params;
    const leaveRequest = await LeaveRequest.findById(requestId)
      .populate(['userId', 'leaveTypeId']);
    
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    await sendLeaveReminderNotification(leaveRequest);
    res.json({ message: 'Test reminder sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyLeave,
  getLeaveRequests,
  getPendingApprovals,
  approveReject,
  cancelLeave,
  getTeamCalendar,
  testLeaveReminder
};