const mongoose = require('mongoose');

const MatchedDonorSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor'
  },
  name: String,
  phone: String,
  bloodGroup: String,
  distanceKm: Number,
  notifiedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['NOTIFIED', 'ACCEPTED', 'DECLINED'],
    default: 'NOTIFIED'
  }
}, { _id: false });

const BloodRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  age: {
    type: Number,
    min: 0,
    max: 120,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    uppercase: true,
    trim: true
  },
  unitsRequired: {
    type: Number,
    required: [true, 'Units required is required'],
    default: 1,
    min: 1
  },
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  hospitalAddress: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  location: {
    lat: {
      type: Number,
      default: 0
    },
    lng: {
      type: Number,
      default: 0
    }
  },
  urgency: {
    type: String,
    enum: ['CRITICAL', 'URGENT', 'STANDARD', 'NORMAL'],
    default: 'URGENT'
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'FULFILLED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING'
  },
  requesterName: {
    type: String,
    required: [true, 'Requester name is required'],
    trim: true
  },
  requesterPhone: {
    type: String,
    required: [true, 'Contact phone is required'],
    trim: true
  },
  requesterEmail: {
    type: String,
    trim: true,
    default: ''
  },
  doctorName: {
    type: String,
    trim: true,
    default: ''
  },
  requiredDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  matchedDonors: [MatchedDonorSchema],
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  fulfilledAt: {
    type: Date,
    default: null
  },
  responseTimeMinutes: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Index for emergency queries and analytics
BloodRequestSchema.index({ status: 1, urgency: 1, createdAt: -1 });
BloodRequestSchema.index({ userId: 1 });

module.exports = mongoose.models.BloodRequest || mongoose.model('BloodRequest', BloodRequestSchema);
