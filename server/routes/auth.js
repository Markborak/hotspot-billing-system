import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Register or login user with phone number
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, email, firstName, lastName } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    
    if (!user) {
      user = new User({
        phoneNumber,
        email,
        firstName,
        lastName
      });
      await user.save();
    } else {
      // Update user info if provided
      if (email) user.email = email;
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      user.lastLogin = new Date();
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;