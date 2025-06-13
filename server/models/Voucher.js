import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  dataUsed: {
    type: Number,
    default: 0
  },
  timeUsed: {
    type: Number,
    default: 0
  },
  sessionStartTime: {
    type: Date
  },
  sessionEndTime: {
    type: Date
  },
  macAddress: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  usedAt: {
    type: Date
  }
});

// Index for automatic expiration
voucherSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Voucher', voucherSchema);