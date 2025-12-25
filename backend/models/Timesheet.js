const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  entries: [{
    project: String,
    task: String,
    startTime: String,
    endTime: String,
    hours: Number,
    description: String,
    billable: { type: Boolean, default: true }
  }],
  totalHours: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'DRAFT'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedDate: Date,
  rejectionReason: String
}, { timestamps: true });

timesheetSchema.pre('save', function(next) {
  this.totalHours = this.entries.reduce((total, entry) => total + (entry.hours || 0), 0);
  next();
});

module.exports = mongoose.model('Timesheet', timesheetSchema);