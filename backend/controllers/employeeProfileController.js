const EmployeeProfile = require('../models/EmployeeProfile');

const getProfile = async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOne({ userId: req.user.id })
      .populate('userId', 'firstName lastName email role department joinDate')
      .populate('professionalInfo.reportingManager', 'firstName lastName');
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllProfiles = async (req, res) => {
  try {
    const profiles = await EmployeeProfile.find()
      .populate('userId', 'firstName lastName email role department joinDate')
      .populate('professionalInfo.reportingManager', 'firstName lastName');
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllProfiles
};