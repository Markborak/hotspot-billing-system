import express from 'express';
import Voucher from '../models/Voucher.js';
import Session from '../models/Session.js';

const router = express.Router();

// Validate voucher
router.post('/validate', async (req, res) => {
  try {
    const { code, macAddress, ipAddress } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Voucher code is required' });
    }

    const voucher = await Voucher.findOne({ code })
      .populate('plan')
      .populate('user');

    if (!voucher) {
      return res.status(404).json({ message: 'Invalid voucher code' });
    }

    if (voucher.status !== 'active') {
      return res.status(400).json({ message: 'Voucher has been used or expired' });
    }

    if (new Date() > voucher.expiresAt) {
      voucher.status = 'expired';
      await voucher.save();
      return res.status(400).json({ message: 'Voucher has expired' });
    }

    res.json({
      success: true,
      voucher: {
        code: voucher.code,
        plan: voucher.plan,
        user: voucher.user,
        expiresAt: voucher.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Use voucher (start session)
router.post('/use', async (req, res) => {
  try {
    const { code, macAddress, ipAddress, userAgent } = req.body;

    const voucher = await Voucher.findOne({ code })
      .populate('plan')
      .populate('user');

    if (!voucher || voucher.status !== 'active') {
      return res.status(400).json({ message: 'Invalid or used voucher' });
    }

    // Start session
    const session = new Session({
      voucher: voucher._id,
      user: voucher.user._id,
      macAddress,
      ipAddress,
      userAgent
    });
    await session.save();

    // Update voucher
    voucher.status = 'used';
    voucher.usedAt = new Date();
    voucher.sessionStartTime = new Date();
    voucher.macAddress = macAddress;
    voucher.ipAddress = ipAddress;
    await voucher.save();

    res.json({
      success: true,
      session: {
        id: session._id,
        plan: voucher.plan,
        startTime: session.startTime
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;