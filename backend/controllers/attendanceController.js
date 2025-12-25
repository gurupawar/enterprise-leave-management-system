const Attendance = require('../models/Attendance');
const User = require('../models/User');
const moment = require('moment');
const { sendHalfDayLOPNotification } = require('../utils/emailService');

const checkIn = async (req, res) => {
  try {
    const { location } = req.body;
    const today = moment().startOf('day').toDate();
    const userId = req.user.id;
    
    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({ userId, date: today });
    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }
    
    const attendance = existingAttendance || new Attendance({ userId, date: today });
    attendance.checkIn = new Date();
    attendance.status = 'Present';
    
    if (location) {
      attendance.location.checkInLocation = location;
    }
    
    await attendance.save();
    res.json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const checkOut = async (req, res) => {
  try {
    const { location } = req.body;
    const today = moment().startOf('day').toDate();
    const userId = req.user.id;
    
    const attendance = await Attendance.findOne({ userId, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'No check-in found for today' });
    }
    
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }
    
    attendance.checkOut = new Date();
    
    if (location) {
      attendance.location.checkOutLocation = location;
    }
    
    await attendance.save();
    
    // Check if worked hours < 7, send LOP email
    if (attendance.totalHours < 7) {
      const user = await User.findById(userId);
      await sendHalfDayLOPNotification(user, attendance);
    }
    
    res.json({ message: 'Checked out successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId, page = 1, limit = 30 } = req.query;
    const filter = {};
    
    if (req.user.role === 'EMPLOYEE') {
      filter.userId = req.user.id;
    } else if (userId) {
      filter.userId = userId;
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendance = await Attendance.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Attendance.countDocuments(filter);
    
    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTodayStatus = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    let userId = req.user.id;

    // Allow managers/HR/Admin to query another user's today status via ?userId=
    if (req.query.userId && ['MANAGER','HR','ADMIN'].includes(req.user.role)) {
      userId = req.query.userId;
    }

    const attendance = await Attendance.findOne({ userId, date: today })
      .populate('userId', 'firstName lastName email');

    res.json({
      user: attendance?.userId || null,
      hasCheckedIn: !!attendance?.checkIn,
      hasCheckedOut: !!attendance?.checkOut,
      checkInTime: attendance?.checkIn,
      checkOutTime: attendance?.checkOut,
      totalHours: attendance?.totalHours || 0,
      status: attendance?.status || 'Absent'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const currentMonth = month || moment().month() + 1;
    const currentYear = year || moment().year();
    
    const startDate = moment(`${currentYear}-${currentMonth}-01`).startOf('month').toDate();
    const endDate = moment(`${currentYear}-${currentMonth}-01`).endOf('month').toDate();
    
    const filter = { date: { $gte: startDate, $lte: endDate } };
    if (userId) filter.userId = userId;
    
    const attendance = await Attendance.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ date: 1 });
    
    // Calculate summary
    const summary = attendance.reduce((acc, record) => {
      const status = record.status;
      acc[status] = (acc[status] || 0) + 1;
      acc.totalHours = (acc.totalHours || 0) + record.totalHours;
      return acc;
    }, {});
    
    res.json({ attendance, summary });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPayrollReport = async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const currentMonth = month || moment().month() + 1;
    const currentYear = year || moment().year();
    
    const startDate = moment(`${currentYear}-${currentMonth}-01`).startOf('month').toDate();
    const endDate = moment(`${currentYear}-${currentMonth}-01`).endOf('month').toDate();
    
    const filter = { date: { $gte: startDate, $lte: endDate } };
    if (userId) filter.userId = userId;
    
    const attendance = await Attendance.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ date: 1 });
    
    const payrollData = attendance.map(record => {
      let payrollHours = record.totalHours;
      let dayType = 'Full Day';
      
      if (record.totalHours < 7) {
        payrollHours = 0.5; // Half day for < 7 hours
        dayType = 'Half Day (LOP)';
      } else if (record.totalHours > 8) {
        payrollHours = 8; // Cap at 8 hours
        dayType = 'Full Day (8hrs max)';
      }
      
      return {
        userId: record.userId._id,
        userName: `${record.userId.firstName} ${record.userId.lastName}`,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        actualHours: record.totalHours,
        payrollHours,
        dayType,
        status: record.status
      };
    });
    
    res.json({ payrollData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getTodayStatus,
  getAttendanceReport,
  getPayrollReport
};