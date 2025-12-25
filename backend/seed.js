require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveType = require('./models/LeaveType');
const Announcement = require('./models/Announcement');
const Holiday = require('./models/Holiday');
const Favorite = require('./models/Favorite');
const EmployeeProfile = require('./models/EmployeeProfile');
const Expense = require('./models/Expense');
const Asset = require('./models/Asset');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await LeaveType.deleteMany({});
    await Announcement.deleteMany({});
    await Holiday.deleteMany({});
    await Favorite.deleteMany({});
    await EmployeeProfile.deleteMany({});
    await Expense.deleteMany({});
    await Asset.deleteMany({});

    // Create real employees
    const admin = await User.create({
      email: 'admin@company.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      department: 'IT',
      dateOfBirth: new Date('1980-01-01'),
      joinDate: new Date('2019-01-01')
    });

    const hr = await User.create({
      email: 'hr@company.com',
      password: 'hr123',
      firstName: 'HR',
      lastName: 'Manager',
      role: 'HR',
      department: 'HR',
      dateOfBirth: new Date('1985-01-01'),
      joinDate: new Date('2019-06-01')
    });

    const manager = await User.create({
      email: 'manager@company.com',
      password: 'manager123',
      firstName: 'Department',
      lastName: 'Manager',
      role: 'MANAGER',
      department: 'Operations',
      dateOfBirth: new Date('1982-01-01'),
      joinDate: new Date('2019-03-01')
    });

    const sushant = await User.create({
      email: 'sushant@krisihigyanai.com',
      password: 'sushant123',
      firstName: 'Sushant',
      lastName: 'Pandit',
      role: 'ADMIN',
      department: 'Admin',
      dateOfBirth: new Date('1985-01-15'),
      joinDate: new Date('2020-01-01')
    });

    const ashutosh = await User.create({
      email: 'ashutosh@krisihigyanai.com',
      password: 'ashutosh123',
      firstName: 'Ashutosh',
      lastName: 'Joshi',
      role: 'HR',
      department: 'Admin',
      dateOfBirth: new Date('1987-03-20'),
      joinDate: new Date('2020-02-01')
    });

    const ram = await User.create({
      email: 'ram@krishigyanai.com',
      password: 'ram123',
      firstName: 'Ram Gopal',
      lastName: 'Kashyap',
      role: 'MANAGER',
      department: 'Admin',
      dateOfBirth: new Date('1983-05-10'),
      joinDate: new Date('2020-01-15')
    });

    const shubhangi = await User.create({
      email: 'shubhangi@krishigyanai.com',
      password: 'shubhangi123',
      firstName: 'Shubhangi',
      lastName: 'Hattigote',
      role: 'EMPLOYEE',
      department: 'Hardware',
      managerId: ram._id,
      dateOfBirth: new Date('1992-07-25'),
      joinDate: new Date('2021-03-01')
    });

    const apeksha = await User.create({
      email: 'apeksha@krishigyanai.com',
      password: 'apeksha123',
      firstName: 'Apeksha',
      lastName: 'Kharat',
      role: 'EMPLOYEE',
      department: 'Hardware',
      managerId: ram._id,
      dateOfBirth: new Date('1995-09-12'),
      joinDate: new Date('2023-01-15')
    });

    const vishal = await User.create({
      email: 'vishal@krishigyanai.com',
      password: 'vishal123',
      firstName: 'Vishal',
      lastName: 'Sutar',
      role: 'EMPLOYEE',
      department: 'Software',
      managerId: ram._id,
      dateOfBirth: new Date('1996-11-08'),
      joinDate: new Date('2023-06-01')
    });

    const aniket = await User.create({
      email: 'aniket@krishigyanai.com',
      password: 'aniket123',
      firstName: 'Aniket',
      lastName: 'Shelake',
      role: 'EMPLOYEE',
      department: 'Software',
      managerId: ram._id,
      dateOfBirth: new Date('1997-02-14'),
      joinDate: new Date('2023-07-01')
    });

    const sanskriti = await User.create({
      email: 'sanskriti@krishigyan.com',
      password: 'sanskriti123',
      firstName: 'Sanskriti',
      lastName: 'Chavan',
      role: 'EMPLOYEE',
      department: 'Software',
      managerId: ram._id,
      dateOfBirth: new Date('1994-04-18'),
      joinDate: new Date('2022-08-01')
    });

    const rupali = await User.create({
      email: 'rupali@krishigyanai.com',
      password: 'rupali123',
      firstName: 'Rupali',
      lastName: 'Surose',
      role: 'EMPLOYEE',
      department: 'Software',
      managerId: ram._id,
      dateOfBirth: new Date('1993-12-05'),
      joinDate: new Date('2022-01-15')
    });

    // Create employee profiles
    await EmployeeProfile.create([
      {
        userId: admin._id,
        professionalInfo: { employeeId: 'ADMIN001', designation: 'System Administrator', workLocation: 'Head Office', employmentType: 'FULL_TIME' }
      },
      {
        userId: hr._id,
        professionalInfo: { employeeId: 'HR001', designation: 'HR Manager', workLocation: 'Head Office', employmentType: 'FULL_TIME' }
      },
      {
        userId: manager._id,
        professionalInfo: { employeeId: 'MGR001', designation: 'Operations Manager', workLocation: 'Head Office', employmentType: 'FULL_TIME' }
      },
      {
        userId: sushant._id,
        professionalInfo: { employeeId: 'LUM/101', designation: 'CEO', workLocation: 'Head Office', employmentType: 'FULL_TIME' }
      },
      {
        userId: ashutosh._id,
        professionalInfo: { employeeId: 'LUM/102', designation: 'CBO', workLocation: 'Head Office', employmentType: 'FULL_TIME' }
      },
      {
        userId: ram._id,
        professionalInfo: { employeeId: 'LUM/103', designation: 'CTO', workLocation: 'Head Office', employmentType: 'FULL_TIME' }
      },
      {
        userId: shubhangi._id,
        professionalInfo: { employeeId: 'LUM/104', designation: 'Electrical Engineer', workLocation: 'Hardware Lab', employmentType: 'FULL_TIME' }
      },
      {
        userId: apeksha._id,
        professionalInfo: { employeeId: 'LUM/105', designation: 'Electrical Engineer Intern', workLocation: 'Hardware Lab', employmentType: 'INTERN' }
      },
      {
        userId: vishal._id,
        professionalInfo: { employeeId: 'LUM/106', designation: 'Software Developer Intern', workLocation: 'Development Center', employmentType: 'INTERN' }
      },
      {
        userId: aniket._id,
        professionalInfo: { employeeId: 'LUM/107', designation: 'Software Developer Intern', workLocation: 'Development Center', employmentType: 'INTERN' }
      },
      {
        userId: sanskriti._id,
        professionalInfo: { employeeId: 'LUM/108', designation: 'UI/UX Designer', workLocation: 'Design Studio', employmentType: 'FULL_TIME' }
      },
      {
        userId: rupali._id,
        professionalInfo: { employeeId: 'LUM/109', designation: 'Software Developer', workLocation: 'Development Center', employmentType: 'FULL_TIME' }
      }
    ]);

    // Create default leave types
    await LeaveType.create([
      { name: 'Annual Leave', description: 'Yearly vacation leave', accrualType: 'YEARLY', accrualRate: 21, maxPerYear: 21, carryForward: true, maxCarryForward: 5, lopEnabled: false, color: '#28a745' },
      { name: 'Sick Leave', description: 'Medical leave for illness', accrualType: 'YEARLY', accrualRate: 12, maxPerYear: 12, carryForward: false, maxCarryForward: 0, lopEnabled: true, color: '#dc3545' },
      { name: 'Personal Leave', description: 'Personal time off', accrualType: 'MONTHLY', accrualRate: 1, maxPerYear: 12, carryForward: false, maxCarryForward: 0, lopEnabled: true, color: '#007bff' },
      { name: 'Maternity Leave', description: 'Maternity leave', accrualType: 'YEARLY', accrualRate: 90, maxPerYear: 90, carryForward: false, maxCarryForward: 0, lopEnabled: false, color: '#e83e8c' }
    ]);

    // Create sample announcements
    await Announcement.create([
      { title: 'Welcome to Krishi Gyan AI LMS!', content: 'Our new Leave Management System is now live with enhanced features.', priority: 'HIGH', targetRoles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'], createdBy: admin._id, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { title: 'Holiday Calendar Updated', content: 'Please check the updated holiday calendar for this year.', priority: 'MEDIUM', targetRoles: ['EMPLOYEE', 'MANAGER'], createdBy: hr._id }
    ]);

    // Create sample holidays
    const currentYear = new Date().getFullYear();
    await Holiday.create([
      { name: 'New Year\'s Day', date: new Date(currentYear + 1, 0, 1), type: 'NATIONAL', description: 'New Year celebration', createdBy: hr._id },
      { name: 'Republic Day', date: new Date(currentYear + 1, 0, 26), type: 'NATIONAL', description: 'Republic Day celebration', createdBy: hr._id },
      { name: 'Independence Day', date: new Date(currentYear + 1, 7, 15), type: 'NATIONAL', description: 'Independence Day celebration', createdBy: hr._id },
      { name: 'Gandhi Jayanti', date: new Date(currentYear + 1, 9, 2), type: 'NATIONAL', description: 'Gandhi Jayanti celebration', createdBy: hr._id },
      { name: 'Diwali', date: new Date(currentYear + 1, 10, 12), type: 'FESTIVAL', description: 'Festival of lights', createdBy: hr._id }
    ]);

    // Create sample favorites
    await Favorite.create([
      { userId: rupali._id, title: 'Company Portal', url: 'https://krishigyanai.com', icon: 'building', order: 1 },
      { userId: rupali._id, title: 'HR Policies', url: 'https://krishigyanai.com/policies', icon: 'file-alt', order: 2 },
      { userId: sanskriti._id, title: 'Design Resources', url: 'https://figma.com', icon: 'palette', order: 1 }
    ]);

    // Create sample assets
    await Asset.create([
      { assetId: 'LAP001', name: 'MacBook Pro 16"', category: 'LAPTOP', brand: 'Apple', model: 'MacBook Pro M2', serialNumber: 'MBP001', purchaseDate: new Date('2023-01-15'), status: 'ASSIGNED', assignedTo: rupali._id, assignedDate: new Date('2023-01-20'), condition: 'GOOD' },
      { assetId: 'LAP002', name: 'Dell Laptop', category: 'LAPTOP', brand: 'Dell', model: 'Inspiron 15', serialNumber: 'DELL001', purchaseDate: new Date('2023-02-01'), status: 'ASSIGNED', assignedTo: sanskriti._id, assignedDate: new Date('2023-02-05'), condition: 'GOOD' },
      { assetId: 'MON001', name: 'Dell Monitor', category: 'MONITOR', brand: 'Dell', model: 'U2720Q', serialNumber: 'MON001', purchaseDate: new Date('2023-03-01'), status: 'AVAILABLE', condition: 'NEW' }
    ]);

    console.log('Krishi Gyan AI employee data seeded successfully!');
    console.log('\nStandard Login Credentials:');
    console.log('Admin: admin@company.com / admin123');
    console.log('HR: hr@company.com / hr123');
    console.log('Manager: manager@company.com / manager123');
    console.log('\nKrishi Gyan AI Employee Credentials:');
    console.log('CEO (Sushant): sushant@krisihigyanai.com / sushant123');
    console.log('CBO (Ashutosh): ashutosh@krisihigyanai.com / ashutosh123');
    console.log('CTO (Ram): ram@krishigyanai.com / ram123');
    console.log('Shubhangi: shubhangi@krishigyanai.com / shubhangi123');
    console.log('Apeksha: apeksha@krishigyanai.com / apeksha123');
    console.log('Vishal: vishal@krishigyanai.com / vishal123');
    console.log('Aniket: aniket@krishigyanai.com / aniket123');
    console.log('Sanskriti: sanskriti@krishigyan.com / sanskriti123');
    console.log('Rupali: rupali@krishigyanai.com / rupali123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();