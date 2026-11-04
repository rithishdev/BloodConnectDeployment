const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  hospitalId: {
    type: String,
    trim: true,
    default: ''
  },
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  emergencyHotline: {
    type: String,
    trim: true,
    default: ''
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
  address: {
    type: String,
    required: [true, 'Address is required'],
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
  bloodInventory: {
    'A+': { type: Number, default: 10, min: 0 },
    'A-': { type: Number, default: 4, min: 0 },
    'B+': { type: Number, default: 12, min: 0 },
    'B-': { type: Number, default: 3, min: 0 },
    'AB+': { type: Number, default: 5, min: 0 },
    'AB-': { type: Number, default: 2, min: 0 },
    'O+': { type: Number, default: 15, min: 0 },
    'O-': { type: Number, default: 2, min: 0 }
  },
  requiredBloodGroups: {
    type: [String],
    default: []
  },
  requiredUnits: {
    type: Number,
    default: 0,
    min: 0
  },
  verified: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

HospitalSchema.index({ city: 1, name: 1 });
HospitalSchema.index({ hospitalId: 1 });

module.exports = mongoose.models.Hospital || mongoose.model('Hospital', HospitalSchema);
