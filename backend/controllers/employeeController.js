const mongoose = require('mongoose');
const EmployeeProfile = require('../models/EmployeeProfile');
const User = require('../models/User');

const createProfile = async (req, res) => {
  try {
    const profile = new EmployeeProfile({
      ...req.body,
      userId: req.user.id
    });
    await profile.save();
    await profile.populate('userId', 'firstName lastName email');
    res.status(201).json({ message: 'Profile created successfully', profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const paramId = req.params.userId;
    const userId = paramId || req.user.id;

    // validate ObjectId when present
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    // Ensure we populate the correct reporting manager path (professionalInfo.reportingManager)
    let profile;
    try {
      profile = await EmployeeProfile.findOne({ userId })
        .populate('userId', 'firstName lastName email role department joinDate')
        .populate('professionalInfo.reportingManager', 'firstName lastName email');
    } catch (popErr) {
      console.error('Error during profile lookup/populate:', popErr);
      // fall back to a simple find without populate to avoid throwing
      profile = await EmployeeProfile.findOne({ userId });
    }

    if (!profile) {
      // Fallback: return a lightweight profile object based on User
      const user = await User.findById(userId).select('firstName lastName email role department');
      if (!user) return res.status(404).json({ message: 'Profile not found' });

      profile = {
        _id: user._id,
        userId: user,
        workInfo: {},
        professionalInfo: {},
        personalInfo: {},
        skills: []
      };
    }

    res.json(profile);
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const profile = await EmployeeProfile.findOneAndUpdate(
      { userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getEmployeeDirectory = async (req, res) => {
  try {
    const { department, location, search, page = 1, limit = 20 } = req.query;
    const baseFilter = { isActive: true };

    // Build flexible filter: department may live on EmployeeProfile.workInfo,
    // EmployeeProfile.professionalInfo, or on the User document.
    let filter = { ...baseFilter };

    if (department) {
      // Find any users with matching department to include
      const usersWithDept = await User.find({ department }).select('_id');
      const userIds = usersWithDept.map(u => u._id);

      filter = {
        ...filter,
        $or: [
          { 'workInfo.department': department },
          { 'professionalInfo.department': department },
          { userId: { $in: userIds } }
        ]
      };
    }

    if (location) {
      // Attach location filter to either existing $or or top-level
      if (filter.$or) {
        // ensure each $or branch also checks location when appropriate
        filter = {
          ...filter,
          $and: [
            { $or: filter.$or },
            { $or: [ { 'workInfo.workLocation': location }, { 'professionalInfo.workLocation': location } ] }
          ]
        };
        delete filter.$or;
      } else {
        filter['workInfo.workLocation'] = location;
      }
    }

    let profiles = await EmployeeProfile.find(filter)
      .populate('userId', 'firstName lastName email role department')
      .populate('workInfo.reportingManager', 'firstName lastName')
      .sort({ 'userId.firstName': 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    if (search) {
      profiles = profiles.filter(profile => 
        profile.userId.firstName.toLowerCase().includes(search.toLowerCase()) ||
        profile.userId.lastName.toLowerCase().includes(search.toLowerCase()) ||
        profile.userId.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const total = await EmployeeProfile.countDocuments(filter);
    // If no profiles found (or to supplement), include Users without profiles
    const profileUserIds = profiles.map(p => p.userId?._id?.toString()).filter(Boolean);

    if (profiles.length < limit) {
      // Build user-level filter to find users matching department/location/search
      const userFilter = { isActive: true };
      if (department) userFilter.department = department;
      if (search) {
        userFilter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (profileUserIds.length) userFilter._id = { $nin: profileUserIds };

      const remaining = Math.max(0, limit - profiles.length);
      const users = await User.find(userFilter).select('firstName lastName email role department').limit(remaining);

      // Map users into lightweight profile-like objects for the frontend
      const userProfiles = users.map(u => ({
        _id: u._id,
        userId: u,
        workInfo: {},
        professionalInfo: {}
      }));

      profiles = profiles.concat(userProfiles);
      // adjust total to reflect both sources
      const usersTotal = await User.countDocuments(userFilter);
      const combinedTotal = total + usersTotal;

      return res.json({
        profiles,
        totalPages: Math.ceil(combinedTotal / limit),
        currentPage: page,
        total: combinedTotal
      });
    }

    res.json({
      profiles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrgChart = async (req, res) => {
  try {
    const profiles = await EmployeeProfile.find({ isActive: true })
      .populate('userId', 'firstName lastName email role')
      .populate('workInfo.reportingManager', 'firstName lastName email');
    
    // Build hierarchical structure
    const orgChart = buildOrgChart(profiles);
    res.json(orgChart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const buildOrgChart = (profiles) => {
  const profileMap = new Map();
  const rootNodes = [];
  
  // Create map of all profiles
  profiles.forEach(profile => {
    profileMap.set(profile.userId._id.toString(), {
      ...profile.toObject(),
      children: []
    });
  });
  
  // Build hierarchy
  profiles.forEach(profile => {
    const managerId = profile.workInfo.reportingManager?._id?.toString();
    if (managerId && profileMap.has(managerId)) {
      profileMap.get(managerId).children.push(profileMap.get(profile.userId._id.toString()));
    } else {
      rootNodes.push(profileMap.get(profile.userId._id.toString()));
    }
  });
  
  return rootNodes;
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  getEmployeeDirectory,
  getOrgChart
};