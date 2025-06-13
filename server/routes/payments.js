import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import { generateVoucher } from '../utils/voucherGenerator.js';

const router = express.Router();

// M-Pesa STK Push
router.post('/mpesa/stkpush', async (req, res) => {
  try {
    const { phoneNumber, planId, amount } = req.body;

    // Validate input
    if (!phoneNumber || !planId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find user and plan
    const user = await User.findOne({ phoneNumber });
    const plan = await Plan.findById(planId);

    if (!user || !plan) {
      return res.status(404).json({ message: 'User or plan not found' });
    }

    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      plan: plan._id,
      amount,
      status: 'pending'
    });
    await transaction.save();

    // Format phone number for M-Pesa (254XXXXXXXXX)
    const formattedPhone = phoneNumber.startsWith('0') 
      ? '254' + phoneNumber.substring(1)
      : phoneNumber.startsWith('+254')
      ? phoneNumber.substring(1)
      : phoneNumber;

    // Get M-Pesa access token
    const token = await getMpesaToken();
    
    // STK Push request
    const timestamp = new Date().toISOString().replace(/[T\-:\.Z]/g, '').slice(0, 14);
    const password = Buffer.from(
      process.env.MPESA_SHORTCODE + 
      process.env.MPESA_PASSKEY + 
      timestamp
    ).toString('base64');

    const stkPushData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE || '174379',
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE || '174379',
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payments/mpesa/callback`,
      AccountReference: `HotSpot-${transaction._id}`,
      TransactionDesc: `Internet Plan - ${plan.name}`
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPushData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update transaction with M-Pesa request ID
    transaction.mpesaRequestId = response.data.CheckoutRequestID;
    await transaction.save();

    res.json({
      success: true,
      message: 'STK push sent successfully',
      transactionId: transaction._id,
      checkoutRequestId: response.data.CheckoutRequestID
    });

  } catch (error) {
    console.error('STK Push error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Payment initiation failed',
      error: error.response?.data?.errorMessage || error.message 
    });
  }
});

// M-Pesa callback
router.post('/mpesa/callback', async (req, res) => {
  try {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    const { stkCallback } = Body;

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const { CheckoutRequestID, CallbackMetadata } = stkCallback;
      
      // Extract payment details
      const metadata = CallbackMetadata.Item;
      const amount = metadata.find(item => item.Name === 'Amount')?.Value;
      const mpesaCode = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;

      // Find and update transaction
      const transaction = await Transaction.findOne({ mpesaRequestId: CheckoutRequestID });
      
      if (transaction) {
        transaction.status = 'completed';
        transaction.mpesaCode = mpesaCode;
        transaction.completedAt = new Date();
        await transaction.save();

        // Generate voucher
        const voucher = await generateVoucher(transaction);
        
        console.log(`Payment completed for transaction ${transaction._id}, voucher: ${voucher.code}`);
      }
    } else {
      // Payment failed
      const transaction = await Transaction.findOne({ mpesaRequestId: stkCallback.CheckoutRequestID });
      if (transaction) {
        transaction.status = 'failed';
        await transaction.save();
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('Callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
  }
});

// Check payment status
router.get('/status/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('user')
      .populate('plan');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    let voucher = null;
    if (transaction.status === 'completed') {
      const Voucher = (await import('../models/Voucher.js')).default;
      voucher = await Voucher.findOne({ transaction: transaction._id });
    }

    res.json({
      transaction,
      voucher: voucher ? {
        code: voucher.code,
        expiresAt: voucher.expiresAt
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to get M-Pesa access token
async function getMpesaToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'}:${process.env.MPESA_CONSUMER_SECRET || 'b2b8c1e2b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8'}`
  ).toString('base64');

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    }
  );

  return response.data.access_token;
}

export default router;