import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDailySalary } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const department = searchParams.get("department") || "";
    const workerId = searchParams.get("workerId") || "";

    const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`);
    const endDate = endOfMonth(startDate);

    const where: any = { employmentStatus: "ACTIVE" };
    if (department) where.department = department;
    if (workerId) where.id = workerId;

    const workers = await prisma.worker.findMany({
      where,
      orderBy: { fullName: "asc" },
    });

    const salaryData = await Promise.all(
      workers.map(async (worker) => {
        const attendance = await prisma.attendance.findMany({
          where: {
            workerId: worker.id,
            date: { gte: startDate, lte: endDate },
          },
        });

        const dailySalary = calculateDailySalary(worker.monthlySalary);
        const presentDays = attendance.filter((a) => a.status === "PRESENT").length;
        const absentDays = attendance.filter((a) => a.status === "ABSENT").length;
        const halfDays = attendance.filter((a) => a.status === "HALF_DAY").length;
        const leaveDays = attendance.filter((a) => a.status === "LEAVE").length;
        const holidayDays = attendance.filter((a) => a.status === "HOLIDAY").length;

        const presentSalary = presentDays * dailySalary;
        const halfDaySalary = halfDays * dailySalary * 0.5;
        const totalEarned = Math.round((presentSalary + halfDaySalary) * 100) / 100;

        return {
          id: worker.id,
          workerId: worker.workerId,
          fullName: worker.fullName,
          department: worker.department,
          monthlySalary: worker.monthlySalary,
          dailySalary,
          presentDays,
          absentDays,
          halfDays,
          leaveDays,
          holidayDays,
          totalEarned,
          attendanceRecords: attendance.length,
        };
      })
    );

    const totalPayroll = salaryData.reduce((sum, w) => sum + w.totalEarned, 0);

    return NextResponse.json({
      workers: salaryData,
      month,
      year,
      totalPayroll,
    });
  } catch (error) {
    console.error("Salary GET error:", error);
    return NextResponse.json(
      { error: "Failed to calculate salary" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { month, year } = await request.json();

    const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`);
    const endDate = endOfMonth(startDate);

    const workers = await prisma.worker.findMany({
      where: { employmentStatus: "ACTIVE" },
    });

    const results = [];

    for (const worker of workers) {
      const attendance = await prisma.attendance.findMany({
        where: {
          workerId: worker.id,
          date: { gte: startDate, lte: endDate },
        },
      });

      const dailySalary = calculateDailySalary(worker.monthlySalary);
      const presentDays = attendance.filter((a) => a.status === "PRESENT").length;
      const absentDays = attendance.filter((a) => a.status === "ABSENT").length;
      const halfDays = attendance.filter((a) => a.status === "HALF_DAY").length;
      const leaveDays = attendance.filter((a) => a.status === "LEAVE").length;
      const holidayDays = attendance.filter((a) => a.status === "HOLIDAY").length;
      const totalEarned = presentDays * dailySalary + halfDays * dailySalary * 0.5;

      const result = await prisma.salaryHistory.upsert({
        where: {
          workerId_month_year: { workerId: worker.id, month, year },
        },
        update: {
          monthlySalary: worker.monthlySalary,
          dailySalary,
          presentDays,
          absentDays,
          halfDays,
          leaveDays,
          holidayDays,
          totalEarnedSalary: Math.round(totalEarned * 100) / 100,
        },
        create: {
          workerId: worker.id,
          month,
          year,
          monthlySalary: worker.monthlySalary,
          dailySalary,
          presentDays,
          absentDays,
          halfDays,
          leaveDays,
          holidayDays,
          totalEarnedSalary: Math.round(totalEarned * 100) / 100,
        },
      });

      results.push(result);
    }

    return NextResponse.json({
      message: `Salary generated for ${results.length} workers`,
      count: results.length,
    });
  } catch (error) {
    console.error("Salary POST error:", error);
    return NextResponse.json(
      { error: "Failed to generate salary" },
      { status: 500 }
    );
  }
}
