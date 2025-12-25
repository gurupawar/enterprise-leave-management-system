const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  type: { type: String, enum: ['ANNUAL', 'QUARTERLY', 'PROBATION', 'PROJECT'], default: 'ANNUAL' },
  status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'], default: 'DRAFT' },
  goals: [{
    title: String,
    description: String,
    targetDate: Date,
    status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], default: 'NOT_STARTED' },
    achievement: String,
    rating: { type: Number, min: 1, max: 5 }
  }],
  competencies: [{
    name: String,
    description: String,
    rating: { type: Number, min: 1, max: 5 },
    comments: String
  }],
  overallRating: { type: Number, min: 1, max: 5 },
  strengths: [String],
  areasForImprovement: [String],
  developmentPlan: String,
  employeeComments: String,
  managerComments: String,
  hrComments: String
}, { timestamps: true });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);