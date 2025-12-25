const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Holiday = require('../models/Holiday');
const Favorite = require('../models/Favorite');
const File = require('../models/File');
const { ensureBalancesForUser } = require('./leaveBalanceController');

const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    // Ensure balances exist and monthly accruals are applied
    await ensureBalancesForUser(userId, currentYear);

    // Leave balances
    const balances = await LeaveBalance.find({ userId, year: currentYear })
      .populate('leaveTypeId', 'name color')
      .lean();

    const balancesWithAvailable = balances.map(b => ({
      ...b,
      available: b.allocated + b.carryForward - b.used - b.pending
    }));

    // Upcoming leaves
    const upcomingLeaves = await LeaveRequest.find({
      userId,
      status: { $in: ['MANAGER_APPROVED', 'HR_APPROVED'] },
      startDate: { $gte: new Date() }
    })
    .populate('leaveTypeId', 'name color')
    .sort({ startDate: 1 })
    .limit(5);

    // Recent leave history
    const recentLeaves = await LeaveRequest.find({ userId })
      .populate('leaveTypeId', 'name color')
      .sort({ createdAt: -1 })
      .limit(10);

    // Pending requests count
    const pendingCount = await LeaveRequest.countDocuments({
      userId,
      status: 'PENDING'
    });

    // Announcements
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { targetRoles: { $in: [req.user.role] } },
        { targetRoles: { $size: 0 } }
      ],
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } }
      ]
    }).populate('createdBy', 'firstName lastName').sort({ priority: -1, createdAt: -1 }).limit(5);

    // Upcoming holidays
    const upcomingHolidays = await Holiday.find({
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(5);

    // Favorites
    const favorites = await Favorite.find({ userId }).sort({ order: 1 });

    // Employee files
    const files = await File.find({
      $or: [
        { type: 'ORGANIZATION', isPublic: true },
        { type: 'EMPLOYEE', targetUserId: userId }
      ]
    }).populate('uploadedBy', 'firstName lastName').sort({ createdAt: -1 }).limit(10);

    res.json({
      balances: balancesWithAvailable,
      upcomingLeaves,
      recentLeaves,
      pendingCount,
      announcements,
      upcomingHolidays,
      favorites,
      files
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getManagerDashboard = async (req, res) => {
  try {
    const managerId = req.user.id;
    
    // Team members
    const teamMembers = await User.find({ managerId }).select('_id firstName lastName');
    const teamMemberIds = teamMembers.map(m => m._id);

    // Pending approvals
    const pendingApprovals = await LeaveRequest.find({
      userId: { $in: teamMemberIds },
      status: 'PENDING'
    })
    .populate('userId', 'firstName lastName')
    .populate('leaveTypeId', 'name color')
    .sort({ createdAt: -1 });

    // Team calendar (next 30 days)
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const teamCalendar = await LeaveRequest.find({
      userId: { $in: teamMemberIds },
      status: { $in: ['MANAGER_APPROVED', 'HR_APPROVED'] },
      startDate: { $lte: next30Days },
      endDate: { $gte: new Date() }
    })
    .populate('userId', 'firstName lastName')
    .populate('leaveTypeId', 'name color')
    .sort({ startDate: 1 });

    // Team leave summary
    const currentYear = new Date().getFullYear();
    const teamSummary = await LeaveBalance.aggregate([
      { $match: { userId: { $in: teamMemberIds }, year: currentYear } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'leavetypes',
          localField: 'leaveTypeId',
          foreignField: '_id',
          as: 'leaveType'
        }
      },
      {
        $group: {
          _id: '$userId',
          user: { $first: { $arrayElemAt: ['$user', 0] } },
          totalAllocated: { $sum: { $add: ['$allocated', '$carryForward'] } },
          totalUsed: { $sum: '$used' },
          totalPending: { $sum: '$pending' }
        }
      }
    ]);

    res.json({
      teamMembers,
      pendingApprovals,
      teamCalendar,
      teamSummary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getHRDashboard = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    const next30Days = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Organization-wide stats
    const totalEmployees = await User.countDocuments({ isActive: true, role: 'EMPLOYEE' });
    
    const leaveStats = await LeaveRequest.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDays: { $sum: '$days' }
        }
      }
    ]);

    // Monthly leave trends
    const monthlyTrends = await LeaveRequest.aggregate([
      {
        $match: {
          status: 'HR_APPROVED',
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDate' },
          count: { $sum: 1 },
          totalDays: { $sum: '$days' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Leave type usage
    const leaveTypeUsage = await LeaveRequest.aggregate([
      {
        $match: {
          status: 'HR_APPROVED',
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $lookup: {
          from: 'leavetypes',
          localField: 'leaveTypeId',
          foreignField: '_id',
          as: 'leaveType'
        }
      },
      {
        $group: {
          _id: '$leaveTypeId',
          leaveType: { $first: { $arrayElemAt: ['$leaveType', 0] } },
          count: { $sum: 1 },
          totalDays: { $sum: '$days' }
        }
      }
    ]);

    // Pending approvals
    const pendingApprovals = await LeaveRequest.countDocuments({
      status: { $in: ['PENDING', 'MANAGER_APPROVED'] }
    });

    // Upcoming birthdays (next 30 days)
    const upcomingBirthdays = await User.find({
      isActive: true,
      dateOfBirth: { $exists: true }
    }).select('firstName lastName dateOfBirth department');

    const birthdaysInRange = upcomingBirthdays.filter(user => {
      const birthday = new Date(user.dateOfBirth);
      const thisYearBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
      const nextYearBirthday = new Date(currentYear + 1, birthday.getMonth(), birthday.getDate());
      
      return (thisYearBirthday >= currentDate && thisYearBirthday <= next30Days) ||
             (nextYearBirthday >= currentDate && nextYearBirthday <= next30Days);
    }).sort((a, b) => {
      const aBirthday = new Date(currentYear, new Date(a.dateOfBirth).getMonth(), new Date(a.dateOfBirth).getDate());
      const bBirthday = new Date(currentYear, new Date(b.dateOfBirth).getMonth(), new Date(b.dateOfBirth).getDate());
      return aBirthday - bBirthday;
    });

    // New hires (last 30 days)
    const newHires = await User.find({
      isActive: true,
      joinDate: { $gte: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000) }
    }).select('firstName lastName joinDate department').sort({ joinDate: -1 });

    res.json({
      totalEmployees,
      leaveStats,
      monthlyTrends,
      leaveTypeUsage,
      pendingApprovals,
      upcomingBirthdays: birthdaysInRange,
      newHires
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const exportLeaveReport = async (req, res) => {
  try {
    const { startDate, endDate, userId, leaveTypeId } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (userId) filter.userId = userId;
    if (leaveTypeId) filter.leaveTypeId = leaveTypeId;

    const leaves = await LeaveRequest.find(filter)
      .populate('userId', 'firstName lastName email department')
      .populate('leaveTypeId', 'name')
      .sort({ startDate: -1 });

    const csvData = leaves.map(leave => ({
      Employee: `${leave.userId.firstName} ${leave.userId.lastName}`,
      Email: leave.userId.email,
      Department: leave.userId.department || '',
      LeaveType: leave.leaveTypeId.name,
      StartDate: leave.startDate.toISOString().split('T')[0],
      EndDate: leave.endDate.toISOString().split('T')[0],
      Days: leave.days,
      Status: leave.status,
      Reason: leave.reason,
      IsLOP: leave.isLOP ? 'Yes' : 'No'
    }));

    res.json(csvData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getEmployeeDashboard,
  getManagerDashboard,
  getHRDashboard,
  exportLeaveReport
};