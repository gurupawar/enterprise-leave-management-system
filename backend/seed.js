require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const LeaveType = require("./models/LeaveType");
const Announcement = require("./models/Announcement");
const Holiday = require("./models/Holiday");
const Favorite = require("./models/Favorite");
const EmployeeProfile = require("./models/EmployeeProfile");
const Expense = require("./models/Expense");
const Asset = require("./models/Asset");

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

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
      email: "admin@backtick.com",
      password: "admin@123",
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
      department: "IT",
      dateOfBirth: new Date("1980-01-01"),
      joinDate: new Date("2019-01-01"),
    });

    const hr = await User.create({
      email: "hr@backtick.com",
      password: "hr@123",
      firstName: "HR",
      lastName: "Manager",
      role: "HR",
      department: "HR",
      dateOfBirth: new Date("1985-01-01"),
      joinDate: new Date("2019-06-01"),
    });

    const manager = await User.create({
      email: "manager@backtick.com",
      password: "manager@123",
      firstName: "Department",
      lastName: "Manager",
      role: "MANAGER",
      department: "Operations",
      dateOfBirth: new Date("1982-01-01"),
      joinDate: new Date("2019-03-01"),
    });

    const employee1 = await User.create({
      email: "gurusheshp@gmail.com",
      password: "employee123",
      firstName: "Gurushesh",
      lastName: "Pawar",
      role: "EMPLOYEE",
      department: "Engineering",
      managerId: manager._id,
      dateOfBirth: new Date("1990-05-15"),
      joinDate: new Date("2022-01-15"),
    });

    const employee2 = await User.create({
      email: "priya.patel@backtick.com",
      password: "employee123",
      firstName: "Priya",
      lastName: "Patel",
      role: "EMPLOYEE",
      department: "Engineering",
      managerId: manager._id,
      dateOfBirth: new Date("1992-08-22"),
      joinDate: new Date("2022-03-01"),
    });

    const employee3 = await User.create({
      email: "rahul.singh@backtick.com",
      password: "employee123",
      firstName: "Rahul",
      lastName: "Singh",
      role: "EMPLOYEE",
      department: "Marketing",
      managerId: manager._id,
      dateOfBirth: new Date("1988-12-10"),
      joinDate: new Date("2021-06-01"),
    });

    const employee4 = await User.create({
      email: "sneha.gupta@backtick.com",
      password: "employee123",
      firstName: "Sneha",
      lastName: "Gupta",
      role: "EMPLOYEE",
      department: "Design",
      managerId: manager._id,
      dateOfBirth: new Date("1995-03-18"),
      joinDate: new Date("2023-01-15"),
    });

    const employee5 = await User.create({
      email: "vikash.kumar@backtick.com",
      password: "employee123",
      firstName: "Vikash",
      lastName: "Kumar",
      role: "EMPLOYEE",
      department: "Sales",
      managerId: manager._id,
      dateOfBirth: new Date("1987-11-25"),
      joinDate: new Date("2020-09-01"),
    });

    // Create employee profiles
    await EmployeeProfile.create([
      {
        userId: admin._id,
        professionalInfo: {
          employeeId: "ADMIN001",
          designation: "System Administrator",
          workLocation: "Head Office",
          employmentType: "FULL_TIME",
        },
      },
      {
        userId: hr._id,
        professionalInfo: {
          employeeId: "HR001",
          designation: "HR Manager",
          workLocation: "Head Office",
          employmentType: "FULL_TIME",
        },
      },
      {
        userId: manager._id,
        professionalInfo: {
          employeeId: "MGR001",
          designation: "Operations Manager",
          workLocation: "Head Office",
          employmentType: "FULL_TIME",
        },
      },
      {
        userId: employee1._id,
        professionalInfo: {
          employeeId: "EMP001",
          designation: "Software Engineer",
          workLocation: "Tech Center",
          employmentType: "FULL_TIME",
        },
      },
      {
        userId: employee2._id,
        professionalInfo: {
          employeeId: "EMP002",
          designation: "Senior Developer",
          workLocation: "Tech Center",
          employmentType: "FULL_TIME",
        },
      },
      {
        userId: employee3._id,
        professionalInfo: {
          employeeId: "EMP003",
          designation: "Marketing Specialist",
          workLocation: "Marketing Office",
          employmentType: "FULL_TIME",
        },
      },
      {
        userId: employee4._id,
        professionalInfo: {
          employeeId: "EMP004",
          designation: "UI/UX Designer",
          workLocation: "Design Studio",
          employmentType: "FULL_TIME",
        },
      },
      {
        userId: employee5._id,
        professionalInfo: {
          employeeId: "EMP005",
          designation: "Sales Representative",
          workLocation: "Sales Office",
          employmentType: "FULL_TIME",
        },
      },
    ]);

    // Create default leave types
    await LeaveType.create([
      {
        name: "Annual Leave",
        description: "Yearly vacation leave",
        accrualType: "YEARLY",
        accrualRate: 21,
        maxPerYear: 21,
        carryForward: true,
        maxCarryForward: 5,
        lopEnabled: false,
        color: "#28a745",
      },
      {
        name: "Sick Leave",
        description: "Medical leave for illness",
        accrualType: "YEARLY",
        accrualRate: 12,
        maxPerYear: 12,
        carryForward: false,
        maxCarryForward: 0,
        lopEnabled: true,
        color: "#dc3545",
      },
      {
        name: "Personal Leave",
        description: "Personal time off",
        accrualType: "MONTHLY",
        accrualRate: 1,
        maxPerYear: 12,
        carryForward: false,
        maxCarryForward: 0,
        lopEnabled: true,
        color: "#007bff",
      },
      {
        name: "Maternity Leave",
        description: "Maternity leave",
        accrualType: "YEARLY",
        accrualRate: 90,
        maxPerYear: 90,
        carryForward: false,
        maxCarryForward: 0,
        lopEnabled: false,
        color: "#e83e8c",
      },
    ]);

    // Create sample announcements
    await Announcement.create([
      {
        title: "Welcome to Company LMS!",
        content:
          "Our new Leave Management System is now live with enhanced features.",
        priority: "HIGH",
        targetRoles: ["EMPLOYEE", "MANAGER", "HR", "ADMIN"],
        createdBy: admin._id,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Holiday Calendar Updated",
        content: "Please check the updated holiday calendar for this year.",
        priority: "MEDIUM",
        targetRoles: ["EMPLOYEE", "MANAGER"],
        createdBy: hr._id,
      },
    ]);

    // Create sample holidays
    const currentYear = new Date().getFullYear();
    await Holiday.create([
      {
        name: "New Year's Day",
        date: new Date(currentYear + 1, 0, 1),
        type: "NATIONAL",
        description: "New Year celebration",
        createdBy: hr._id,
      },
      {
        name: "Republic Day",
        date: new Date(currentYear + 1, 0, 26),
        type: "NATIONAL",
        description: "Republic Day celebration",
        createdBy: hr._id,
      },
      {
        name: "Independence Day",
        date: new Date(currentYear + 1, 7, 15),
        type: "NATIONAL",
        description: "Independence Day celebration",
        createdBy: hr._id,
      },
      {
        name: "Gandhi Jayanti",
        date: new Date(currentYear + 1, 9, 2),
        type: "NATIONAL",
        description: "Gandhi Jayanti celebration",
        createdBy: hr._id,
      },
      {
        name: "Diwali",
        date: new Date(currentYear + 1, 10, 12),
        type: "FESTIVAL",
        description: "Festival of lights",
        createdBy: hr._id,
      },
    ]);

    // Create sample favorites
    await Favorite.create([
      {
        userId: employee1._id,
        title: "Company Portal",
        url: "https://company.com",
        icon: "building",
        order: 1,
      },
      {
        userId: employee1._id,
        title: "HR Policies",
        url: "https://company.com/policies",
        icon: "file-alt",
        order: 2,
      },
      {
        userId: employee4._id,
        title: "Design Resources",
        url: "https://figma.com",
        icon: "palette",
        order: 1,
      },
    ]);

    // Create sample assets
    await Asset.create([
      {
        assetId: "LAP001",
        name: 'MacBook Pro 16"',
        category: "LAPTOP",
        brand: "Apple",
        model: "MacBook Pro M2",
        serialNumber: "MBP001",
        purchaseDate: new Date("2023-01-15"),
        status: "ASSIGNED",
        assignedTo: employee1._id,
        assignedDate: new Date("2023-01-20"),
        condition: "GOOD",
      },
      {
        assetId: "LAP002",
        name: "Dell Laptop",
        category: "LAPTOP",
        brand: "Dell",
        model: "Inspiron 15",
        serialNumber: "DELL001",
        purchaseDate: new Date("2023-02-01"),
        status: "ASSIGNED",
        assignedTo: employee4._id,
        assignedDate: new Date("2023-02-05"),
        condition: "GOOD",
      },
      {
        assetId: "MON001",
        name: "Dell Monitor",
        category: "MONITOR",
        brand: "Dell",
        model: "U2720Q",
        serialNumber: "MON001",
        purchaseDate: new Date("2023-03-01"),
        status: "AVAILABLE",
        condition: "NEW",
      },
    ]);

    console.log("Company employee data seeded successfully!");
    console.log("\nLogin Credentials:");
    console.log("Admin: admin@backtick.com / admin123");
    console.log("HR: hr@backtick.com / hr123");
    console.log("Manager: manager@backtick.com / manager123");
    console.log("\nEmployee Credentials:");
    console.log("Rahul Sharma: rahul.sharma@backtick.com / employee123");
    console.log("Priya Patel: priya.patel@backtick.com / employee123");
    console.log("Amit Singh: amit.singh@backtick.com / employee123");
    console.log("Sneha Gupta: sneha.gupta@backtick.com / employee123");
    console.log("Vikash Kumar: vikash.kumar@backtick.com / employee123");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
