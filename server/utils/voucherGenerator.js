import crypto from 'crypto';
import Voucher from '../models/Voucher.js';
import Plan from '../models/Plan.js';

// Generate a single voucher
export async function generateVoucher(transaction) {
  try {
    const plan = await Plan.findById(transaction.plan);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Generate unique voucher code
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = generateVoucherCode();
      const existing = await Voucher.findOne({ code });
      if (!existing) {
        isUnique = true;
      }
    }

    // Calculate expiry date (24 hours from now by default)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const voucher = new Voucher({
      code,
      user: transaction.user,
      plan: transaction.plan,
      transaction: transaction._id,
      expiresAt
    });

    await voucher.save();
    return voucher;
  } catch (error) {
    throw error;
  }
}

// Generate bulk vouchers
export async function generateBulkVouchers(planId, quantity = 10, expiryDays = 30) {
  try {
    const plan = await Plan.findById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const vouchers = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    for (let i = 0; i < quantity; i++) {
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        code = generateVoucherCode();
        const existing = await Voucher.findOne({ code });
        if (!existing) {
          isUnique = true;
        }
      }

      const voucher = new Voucher({
        code,
        plan: planId,
        expiresAt
      });

      await voucher.save();
      vouchers.push(voucher);
    }

    return vouchers;
  } catch (error) {
    throw error;
  }
}

// Generate voucher code
function generateVoucherCode() {
  // Generate 8-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Format as XXXX-XXXX
  return result.substring(0, 4) + '-' + result.substring(4, 8);
}