import express from 'express';
import Plan from '../models/Plan.js';
import Transaction from '../models/Transaction.js';
import Voucher from '../models/Voucher.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { generateBulkVouchers } from '../utils/voucherGenerator.js';

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const activeVouchers = await Voucher.countDocuments({ status: 'active' });
    const activeSessions = await Session.countDocuments({ status: 'active' });

    res.json({
      totalUsers,
      totalTransactions,
      totalRevenue: totalRevenue[0]?.total || 0,
      activeVouchers,
      activeSessions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Plan management
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Transaction logs
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .populate('user')
      .populate('plan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments();

    res.json({
      transactions,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Voucher management
router.get('/vouchers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const vouchers = await Voucher.find()
      .populate('user')
      .populate('plan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Voucher.countDocuments();

    res.json({
      vouchers,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/vouchers/bulk', async (req, res) => {
  try {
    const { planId, quantity = 10, expiryDays = 30 } = req.body;
    
    const vouchers = await generateBulkVouchers(planId, quantity, expiryDays);
    
    res.json({
      success: true,
      message: `${quantity} vouchers generated successfully`,
      vouchers: vouchers.map(v => ({ code: v.code, expiresAt: v.expiresAt }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Session logs
router.get('/sessions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await Session.find()
      .populate({
        path: 'voucher',
        populate: { path: 'plan user' }
      })
      .populate('user')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments();

    res.json({
      sessions,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;