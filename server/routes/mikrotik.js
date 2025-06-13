import express from 'express';
import Voucher from '../models/Voucher.js';
import Session from '../models/Session.js';

const router = express.Router();

// RADIUS authentication endpoint
router.post('/auth', async (req, res) => {
  try {
    const { username, password, macAddress, ipAddress } = req.body;

    // Check if username is a voucher code
    const voucher = await Voucher.findOne({ code: username })
      .populate('plan')
      .populate('user');

    if (!voucher) {
      return res.json({
        'Reply-Message': 'Invalid credentials',
        'Auth-Type': 'Reject'
      });
    }

    if (voucher.status !== 'active' || new Date() > voucher.expiresAt) {
      return res.json({
        'Reply-Message': 'Voucher expired or used',
        'Auth-Type': 'Reject'
      });
    }

    // Return RADIUS attributes for MikroTik
    res.json({
      'Auth-Type': 'Accept',
      'Session-Timeout': voucher.plan.timeLimit * 60, // Convert minutes to seconds
      'Mikrotik-Total-Limit': voucher.plan.dataLimit * 1024 * 1024, // Convert MB to bytes
      'Reply-Message': 'Authentication successful'
    });

  } catch (error) {
    res.json({
      'Reply-Message': 'Authentication error',
      'Auth-Type': 'Reject'
    });
  }
});

// RADIUS accounting endpoint
router.post('/accounting', async (req, res) => {
  try {
    const {
      username,
      'Acct-Status-Type': statusType,
      'Acct-Input-Octets': inputOctets = 0,
      'Acct-Output-Octets': outputOctets = 0,
      'Acct-Session-Time': sessionTime = 0,
      'Calling-Station-Id': macAddress,
      'Framed-IP-Address': ipAddress
    } = req.body;

    const voucher = await Voucher.findOne({ code: username });
    if (!voucher) {
      return res.json({ 'Acct-Status-Type': 'Failed' });
    }

    if (statusType === 'Start') {
      // Session start
      const session = new Session({
        voucher: voucher._id,
        user: voucher.user,
        macAddress,
        ipAddress,
        status: 'active'
      });
      await session.save();

      voucher.sessionStartTime = new Date();
      await voucher.save();

    } else if (statusType === 'Update' || statusType === 'Stop') {
      // Update session data
      const session = await Session.findOne({ 
        voucher: voucher._id, 
        status: 'active' 
      });

      if (session) {
        session.dataUsed = (parseInt(inputOctets) + parseInt(outputOctets)) / (1024 * 1024); // Convert to MB
        session.timeUsed = parseInt(sessionTime) / 60; // Convert to minutes
        session.lastActivity = new Date();

        if (statusType === 'Stop') {
          session.status = 'terminated';
          session.endTime = new Date();
          voucher.status = 'used';
          voucher.sessionEndTime = new Date();
        }

        await session.save();
        await voucher.save();
      }
    }

    res.json({ 'Acct-Status-Type': 'Success' });

  } catch (error) {
    res.json({ 'Acct-Status-Type': 'Failed' });
  }
});

// Check user session status
router.get('/status/:username', async (req, res) => {
  try {
    const voucher = await Voucher.findOne({ code: req.params.username })
      .populate('plan')
      .populate('user');

    if (!voucher) {
      return res.status(404).json({ message: 'User not found' });
    }

    const session = await Session.findOne({ 
      voucher: voucher._id 
    }).sort({ startTime: -1 });

    res.json({
      username: voucher.code,
      status: voucher.status,
      plan: voucher.plan,
      user: voucher.user,
      session: session ? {
        dataUsed: session.dataUsed,
        timeUsed: session.timeUsed,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        status: session.status
      } : null,
      limits: {
        dataLimit: voucher.plan.dataLimit,
        timeLimit: voucher.plan.timeLimit
      },
      expiresAt: voucher.expiresAt
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;