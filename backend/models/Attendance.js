const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: Date,
  checkOut: Date,
  breakTime: { type: Number, default: 0 }, // in minutes
  totalHours: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Late', 'On Leave'],
    default: 'Absent'
  },
  location: {
    checkInLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    checkOutLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  },
  notes: String,
  isManualEntry: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    this.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    
    if (this.totalHours < 7) {
      this.status = 'Half Day';
    } else if (this.totalHours >= 7) {
      this.status = 'Present';
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);