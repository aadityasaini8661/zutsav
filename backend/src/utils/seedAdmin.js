const User = require('../models/User');

const seedAdmin = async () => {
  const exists = await User.findOne({ role: 'admin' });
  if (exists) {
    console.log('✅ Admin already exists — skipping seed');
    return;
  }

  await User.create({
    name:     process.env.ADMIN_NAME     || 'Zutsav Admin',
    phone:    process.env.ADMIN_PHONE    || '9999999999',
    email:    process.env.ADMIN_EMAIL    || 'admin@zutsav.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role:     'admin',
    isActive: true,
  });

  console.log('🌱 Admin seeded successfully');
  console.log(`   Phone   : ${process.env.ADMIN_PHONE    || '9999999999'}`);
  console.log(`   Email   : ${process.env.ADMIN_EMAIL    || 'admin@zutsav.com'}`);
  console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
};

module.exports = seedAdmin;
