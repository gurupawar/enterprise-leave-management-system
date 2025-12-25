const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { 
    type: String, 
    enum: ['TECHNICAL', 'SOFT_SKILLS', 'COMPLIANCE', 'LEADERSHIP', 'SAFETY', 'OTHER'],
    required: true 
  },
  type: { type: String, enum: ['ONLINE', 'CLASSROOM', 'WORKSHOP', 'WEBINAR'], required: true },
  duration: Number, // in hours
  instructor: String,
  maxParticipants: Number,
  startDate: Date,
  endDate: Date,
  location: String,
  materials: [{
    name: String,
    filePath: String,
    type: { type: String, enum: ['PDF', 'VIDEO', 'PRESENTATION', 'DOCUMENT'] }
  }],
  participants: [{
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    enrollmentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED'], default: 'ENROLLED' },
    completionDate: Date,
    score: Number,
    feedback: String
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Training', trainingSchema);