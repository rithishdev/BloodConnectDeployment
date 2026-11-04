const mongoose = require('mongoose');

const DonorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: {
    type: String,
    required: [true, 'Donor name is required'],
    trim: true
  },
  age: {
    type: Number,
    min: [18, 'Donor must be at least 18 years old'],
    max: [65, 'Donor age must be 65 or below'],
    default: 25
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    uppercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Contact phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    lat: {
      type: Number,
      required: false,
      default: 0
    },
    lng: {
      type: Number,
      required: false,
      default: 0
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  availabilityStatus: {
    type: String,
    enum: ['Available', 'Busy', 'Donated Recently', 'Inactive'],
    default: 'Available'
  },
  lastDonatedDate: {
    type: Date,
    default: null
  },
  totalDonations: {
    type: Number,
    default: 0,
    min: 0
  },
  emergencyRadiusKm: {
    type: Number,
    default: 25,
    min: 1
  },
  notes: {
    type: String,
    default: ''
  },
  // Eligibility & Medical Screening
  weightKg: {
    type: Number,
    default: 55
  },
  hasDonatedBefore: {
    type: Boolean,
    default: false
  },
  lastDonationDate: {
    type: Date,
    default: null
  },
  preliminaryEligibilityStatus: {
    type: String,
    enum: ['ELIGIBILITY PENDING', 'PRELIMINARILY ELIGIBLE', 'NOT ELIGIBLE', 'AWAITING MEDICAL SCREENING', 'MEDICALLY CLEARED'],
    default: 'AWAITING MEDICAL SCREENING'
  },
  minimumWeightThreshold: {
    type: Number,
    default: 50
  },
  requiredDonationIntervalDays: {
    type: Number,
    default: 120
  },
  nextEligibleDonationDate: {
    type: Date,
    default: null
  },
  medicalScreeningStatus: {
    type: String,
    enum: ['PENDING', 'AWAITING_MEDICAL_SCREENING', 'MEDICALLY_CLEARED', 'NOT_ELIGIBLE', 'REJECTED'],
    default: 'AWAITING_MEDICAL_SCREENING'
  }
}, {
  timestamps: true
});

// Index for high-performance searching by bloodGroup, city, and availability
DonorSchema.index({ bloodGroup: 1, city: 1, isAvailable: 1 });
DonorSchema.index({ userId: 1 });

module.exports = mongoose.models.Donor || mongoose.model('Donor', DonorSchema);
