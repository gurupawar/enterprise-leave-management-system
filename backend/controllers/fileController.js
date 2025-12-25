const File = require('../models/File');
const path = require('path');
const fs = require('fs');

const getFiles = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};

    if (type) query.type = type;

    if (req.user.role === 'EMPLOYEE') {
      query.$or = [
        { type: 'ORGANIZATION', isPublic: true },
        { type: 'EMPLOYEE', targetUserId: req.user.id }
      ];
    }

    const files = await File.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadFile = async (req, res) => {
  try {
    const file = new File({
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      type: req.body.type,
      category: req.body.category,
      uploadedBy: req.user.id,
      targetUserId: req.body.targetUserId,
      isPublic: req.body.isPublic === 'true',
      description: req.body.description
    });

    await file.save();
    res.status(201).json(file);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (req.user.role === 'EMPLOYEE' && file.type === 'EMPLOYEE' && 
        file.targetUserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.download(file.path, file.originalName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    fs.unlinkSync(file.path);
    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile
};