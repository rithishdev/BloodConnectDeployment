const mongoose = require('mongoose');

const BloodUsageSchema = new mongoose.Schema({
  usageId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    uppercase: true,
    trim: true
  },
  units: {
    type: Number,
    required: [true, 'Units issued is required'],
    min: [1, 'At least 1 unit must be issued'],
    default: 1
  },
  hospitalId: {
    type: String,
    required: [true, 'Hospital ID is required'],
    trim: true
  },
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  requestId: {
    type: String,
    default: null
  },
  patientName: {
    type: String,
    default: 'Emergency Patient',
    trim: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['FULFILLED', 'ISSUED', 'COMPLETED', 'CANCELLED'],
    default: 'FULFILLED'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

BloodUsageSchema.index({ date: -1, bloodGroup: 1 });
BloodUsageSchema.index({ hospitalId: 1, date: -1 });
BloodUsageSchema.index({ requestId: 1 });

module.exports = mongoose.models.BloodUsage || mongoose.model('BloodUsage', BloodUsageSchema);
