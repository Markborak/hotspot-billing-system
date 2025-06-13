import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedPlans } from './data/sample-plans.js';

dotenv.config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotspot-billing');
    console.log('Connected to MongoDB');
    
    await seedPlans();
    
    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();