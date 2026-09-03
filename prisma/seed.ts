import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays, format, addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.salaryHistory.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.user.deleteMany();
  await prisma.companySettings.deleteMany();

  // Create admin user
  const passwordHash = await hash("admin123", 10);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@company.com",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created: admin@company.com / admin123");

  // Create company settings
  await prisma.companySettings.create({
    data: {
      companyName: "Sharma Manufacturing Pvt Ltd",
      address: "Plot 42, Industrial Area, Jaipur, Rajasthan",
      salaryDivisor: 30,
      holidaySalaryPaid: false,
    },
  });

  // Create workers
  const workersData = [
    { workerId: "WRK-0001", fullName: "Rahul Sharma", mobile: "9876543210", department: "Production", designation: "Senior Operator", workerType: "Machine Operator", salary: 18000 },
    { workerId: "WRK-0002", fullName: "Amit Kumar", mobile: "9876543211", department: "Production", designation: "Operator", workerType: "Machine Operator", salary: 15000 },
    { workerId: "WRK-0003", fullName: "Ramesh Patel", mobile: "9876543212", department: "Assembly", designation: "Assembly Worker", workerType: "Labourer", salary: 12000 },
    { workerId: "WRK-0004", fullName: "Suresh Yadav", mobile: "9876543213", department: "Assembly", designation: "Assembly Lead", workerType: "Supervisor", salary: 20000 },
    { workerId: "WRK-0005", fullName: "Vikram Singh", mobile: "9876543214", department: "Quality Control", designation: "QC Inspector", workerType: "Technician", salary: 16000 },
    { workerId: "WRK-0006", fullName: "Deepak Gupta", mobile: "9876543215", department: "Maintenance", designation: "Maintenance Tech", workerType: "Technician", salary: 17000 },
    { workerId: "WRK-0007", fullName: "Rajesh Verma", mobile: "9876543216", department: "Packaging", designation: "Packer", workerType: "Labourer", salary: 11000 },
    { workerId: "WRK-0008", fullName: "Manoj Tiwari", mobile: "9876543217", department: "Production", designation: "Helper", workerType: "Helper", salary: 10000 },
    { workerId: "WRK-0009", fullName: "Priya Kumari", mobile: "9876543218", department: "Quality Control", designation: "QC Analyst", workerType: "Technician", salary: 14000 },
    { workerId: "WRK-0010", fullName: "Anita Devi", mobile: "9876543219", department: "Packaging", designation: "Senior Packer", workerType: "Labourer", salary: 12500 },
    { workerId: "WRK-0011", fullName: "Sanjay Mishra", mobile: "9876543220", department: "Warehouse", designation: "Store Keeper", workerType: "Labourer", salary: 13000 },
    { workerId: "WRK-0012", fullName: "Kiran Joshi", mobile: "9876543221", department: "Production", designation: "Operator", workerType: "Machine Operator", salary: 15000 },
  ];

  const workers = [];
  for (const w of workersData) {
    const worker = await prisma.worker.create({
      data: {
        workerId: w.workerId,
        fullName: w.fullName,
        mobileNumber: w.mobile,
        department: w.department,
        designation: w.designation,
        workerType: w.workerType,
        monthlySalary: w.salary,
        joiningDate: new Date("2025-01-15"),
        gender: ["Priya Kumari", "Anita Devi"].includes(w.fullName) ? "Female" : "Male",
        address: "Industrial Colony, Jaipur",
      },
    });
    workers.push(worker);
  }
  console.log(`✅ ${workers.length} workers created`);

  // Create holidays
  const holidays = [
    { name: "Republic Day", date: "2026-01-26" },
    { name: "Holi", date: "2026-03-17" },
    { name: "Good Friday", date: "2026-04-03" },
    { name: "Independence Day", date: "2026-08-15" },
    { name: "Gandhi Jayanti", date: "2026-10-02" },
    { name: "Diwali", date: "2026-11-08" },
    { name: "Christmas", date: "2026-12-25" },
  ];

  for (const h of holidays) {
    await prisma.holiday.create({
      data: {
        holidayName: h.name,
        date: new Date(h.date + "T00:00:00.000Z"),
        description: `National holiday - ${h.name}`,
      },
    });
  }
  console.log(`✅ ${holidays.length} holidays created`);

  // Generate attendance for the last 60 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statuses = ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "ABSENT", "HALF_DAY"];
  const checkInTimes = ["08:45", "08:55", "09:00", "09:05", "09:10", "09:15", "09:20", "09:30"];
  const checkOutTimes = ["17:30", "17:45", "18:00", "18:10", "18:15", "18:30", "18:45", "19:00"];

  let attendanceCount = 0;

  for (let dayOffset = 60; dayOffset >= 1; dayOffset--) {
    const date = subDays(today, dayOffset);
    const dayOfWeek = date.getDay();

    // Skip Sundays
    if (dayOfWeek === 0) continue;

    // Check if it's a holiday
    const dateStr = format(date, "yyyy-MM-dd");
    const isHoliday = holidays.some((h) => h.date === dateStr);

    for (const worker of workers) {
      const dailySalary = Math.round((worker.monthlySalary / 30) * 100) / 100;

      if (isHoliday) {
        await prisma.attendance.create({
          data: {
            workerId: worker.id,
            date: new Date(dateStr + "T00:00:00.000Z"),
            status: "HOLIDAY",
            dailySalary,
            earnedSalary: 0,
          },
        });
      } else {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const checkIn = checkInTimes[Math.floor(Math.random() * checkInTimes.length)];
        const checkOut = checkOutTimes[Math.floor(Math.random() * checkOutTimes.length)];

        let earnedSalary = 0;
        let workingMinutes: number | null = null;

        if (randomStatus === "PRESENT") {
          earnedSalary = dailySalary;
          const [inH, inM] = checkIn.split(":").map(Number);
          const [outH, outM] = checkOut.split(":").map(Number);
          workingMinutes = (outH * 60 + outM) - (inH * 60 + inM);
        } else if (randomStatus === "HALF_DAY") {
          earnedSalary = Math.round(dailySalary * 0.5 * 100) / 100;
          workingMinutes = 240 + Math.floor(Math.random() * 60);
        }

        await prisma.attendance.create({
          data: {
            workerId: worker.id,
            date: new Date(dateStr + "T00:00:00.000Z"),
            status: randomStatus,
            checkInTime: randomStatus === "PRESENT" || randomStatus === "HALF_DAY" ? checkIn : null,
            checkOutTime: randomStatus === "PRESENT" ? checkOut : null,
            workingMinutes,
            dailySalary,
            earnedSalary,
          },
        });
      }
      attendanceCount++;
    }
  }
  console.log(`✅ ${attendanceCount} attendance records created`);

  // Create some leave records
  const leaveData = [
    { workerIdx: 2, start: 10, end: 12, type: "SICK", reason: "Fever" },
    { workerIdx: 5, start: 5, end: 6, type: "PERSONAL", reason: "Family function" },
    { workerIdx: 8, start: 15, end: 15, type: "EMERGENCY", reason: "Home emergency" },
  ];

  for (const l of leaveData) {
    const startDate = subDays(today, l.start);
    const endDate = subDays(today, l.end);
    await prisma.leave.create({
      data: {
        workerId: workers[l.workerIdx].id,
        startDate: new Date(format(startDate, "yyyy-MM-dd") + "T00:00:00.000Z"),
        endDate: new Date(format(endDate, "yyyy-MM-dd") + "T00:00:00.000Z"),
        leaveType: l.type,
        reason: l.reason,
      },
    });
  }
  console.log("✅ Leave records created");

  // Generate salary history for previous month
  const prevMonth = today.getMonth(); // 0-indexed, so current getMonth() is previous month if we're at start
  const prevYear = prevMonth === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const salaryMonth = prevMonth === 0 ? 12 : prevMonth;

  for (const worker of workers) {
    const dailySalary = Math.round((worker.monthlySalary / 30) * 100) / 100;
    const presentDays = 20 + Math.floor(Math.random() * 6);
    const absentDays = 30 - presentDays - 2;
    const halfDays = Math.floor(Math.random() * 3);
    const totalEarned = presentDays * dailySalary + halfDays * dailySalary * 0.5;

    await prisma.salaryHistory.create({
      data: {
        workerId: worker.id,
        month: salaryMonth,
        year: prevYear,
        monthlySalary: worker.monthlySalary,
        dailySalary,
        presentDays,
        absentDays,
        halfDays,
        leaveDays: 2,
        holidayDays: 0,
        totalEarnedSalary: Math.round(totalEarned * 100) / 100,
      },
    });
  }
  console.log("✅ Salary history created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("   Login: admin@company.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
