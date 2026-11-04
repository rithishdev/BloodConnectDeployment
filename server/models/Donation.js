const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    default: null
  },
  donorName: {
    type: String,
    trim: true,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  },
  hospitalName: {
    type: String,
    trim: true,
    default: ''
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    default: null
  },
  patientName: {
    type: String,
    trim: true,
    default: ''
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    uppercase: true
  },
  units: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  type: {
    type: String,
    enum: ['DONATION', 'USAGE'],
    default: 'DONATION'
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'PENDING', 'CANCELLED'],
    default: 'COMPLETED'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

DonationSchema.index({ date: -1, bloodGroup: 1, type: 1 });
DonationSchema.index({ donorId: 1 });
DonationSchema.index({ userId: 1 });

module.exports = mongoose.models.Donation || mongoose.model('Donation', DonationSchema);
