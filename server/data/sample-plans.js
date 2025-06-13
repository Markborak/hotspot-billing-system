import Plan from '../models/Plan.js';

export const samplePlans = [
  {
    name: 'Quick Browse',
    price: 50,
    currency: 'KES',
    dataLimit: 250, // 250 MB
    timeLimit: 60, // 1 hour
    description: 'Perfect for quick browsing and messaging'
  },
  {
    name: 'Social Media',
    price: 100,
    currency: 'KES',
    dataLimit: 500, // 500 MB
    timeLimit: 120, // 2 hours
    description: 'Great for social media and light streaming'
  },
  {
    name: 'Standard Package',
    price: 200,
    currency: 'KES',
    dataLimit: 1024, // 1 GB
    timeLimit: 240, // 4 hours
    description: 'Standard package for regular internet use'
  },
  {
    name: 'Power User',
    price: 350,
    currency: 'KES',
    dataLimit: 2048, // 2 GB
    timeLimit: 480, // 8 hours
    description: 'For heavy internet users and video streaming'
  },
  {
    name: 'All Day Pass',
    price: 500,
    currency: 'KES',
    dataLimit: 3072, // 3 GB
    timeLimit: 720, // 12 hours
    description: 'Full day internet access'
  }
];

export async function seedPlans() {
  try {
    const existingPlans = await Plan.countDocuments();
    
    if (existingPlans === 0) {
      await Plan.insertMany(samplePlans);
      console.log('Sample plans seeded successfully');
    } else {
      console.log('Plans already exist, skipping seed');
    }
  } catch (error) {
    console.error('Error seeding plans:', error);
  }
}