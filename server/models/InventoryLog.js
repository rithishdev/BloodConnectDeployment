const mongoose = require('mongoose');

const InventoryLogSchema = new mongoose.Schema({
  hospitalId: {
    type: String,
    required: true,
    trim: true
  },
  hospitalName: {
    type: String,
    required: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    uppercase: true
  },
  changeType: {
    type: String,
    enum: ['DONATION', 'USAGE', 'STOCK_ADDITION', 'MANUAL_ADJUSTMENT', 'CORRECTION'],
    required: true
  },
  unitsDelta: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true,
    min: 0
  },
  newStock: {
    type: Number,
    required: true,
    min: 0
  },
  referenceId: {
    type: String,
    default: null
  },
  performedBy: {
    type: String,
    default: 'SYSTEM'
  },
  notes: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

InventoryLogSchema.index({ hospitalId: 1, timestamp: -1 });
InventoryLogSchema.index({ bloodGroup: 1, timestamp: -1 });

module.exports = mongoose.models.InventoryLog || mongoose.model('InventoryLog', InventoryLogSchema);
