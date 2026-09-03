import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDailySalary, calculateEarnedSalary, calculateWorkingMinutes } from "@/lib/utils";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
    const workerId = searchParams.get("workerId");
    const date = new Date(dateStr + "T00:00:00.000Z");

    if (workerId) {
      // Single worker attendance for a date range or single date
      const month = searchParams.get("month");
      const year = searchParams.get("year");

      if (month && year) {
        const startDate = new Date(`${year}-${month.padStart(2, "0")}-01T00:00:00.000Z`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);

        const attendance = await prisma.attendance.findMany({
          where: {
            workerId,
            date: { gte: startDate, lte: endDate },
          },
          orderBy: { date: "asc" },
        });

        return NextResponse.json({ attendance });
      }

      const record = await prisma.attendance.findUnique({
        where: {
          workerId_date: { workerId, date },
        },
      });

      return NextResponse.json({ attendance: record });
    }

    // All workers' attendance for a specific date
    const workers = await prisma.worker.findMany({
      where: { employmentStatus: "ACTIVE" },
      orderBy: { fullName: "asc" },
    });

    const attendance = await prisma.attendance.findMany({
      where: { date },
    });

    const attendanceMap: Record<string, any> = {};
    attendance.forEach((a) => {
      attendanceMap[a.workerId] = a;
    });

    const result = workers.map((w) => {
      const att = attendanceMap[w.id];
      return {
        id: w.id,
        workerId: w.workerId,
        fullName: w.fullName,
        department: w.department,
        monthlySalary: w.monthlySalary,
        dailySalary: calculateDailySalary(w.monthlySalary),
        profilePhoto: w.profilePhoto,
        attendance: att
          ? {
              id: att.id,
              status: att.status,
              checkInTime: att.checkInTime,
              checkOutTime: att.checkOutTime,
              workingMinutes: att.workingMinutes,
              earnedSalary: att.earnedSalary,
              notes: att.notes,
            }
          : null,
      };
    });

    return NextResponse.json({ workers: result, date: dateStr });
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date: dateStr, records } = body;

    if (!dateStr || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Date and records are required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr + "T00:00:00.000Z");
    const results = [];

    for (const record of records) {
      const worker = await prisma.worker.findUnique({
        where: { id: record.workerId },
      });

      if (!worker) continue;

      const dailySalary = calculateDailySalary(worker.monthlySalary);
      const earnedSalary = calculateEarnedSalary(dailySalary, record.status);
      const workingMins = calculateWorkingMinutes(
        record.checkInTime || null,
        record.checkOutTime || null
      );

      const result = await prisma.attendance.upsert({
        where: {
          workerId_date: {
            workerId: record.workerId,
            date,
          },
        },
        update: {
          status: record.status,
          checkInTime: record.checkInTime || null,
          checkOutTime: record.checkOutTime || null,
          workingMinutes: workingMins,
          dailySalary,
          earnedSalary,
          notes: record.notes || null,
        },
        create: {
          workerId: record.workerId,
          date,
          status: record.status,
          checkInTime: record.checkInTime || null,
          checkOutTime: record.checkOutTime || null,
          workingMinutes: workingMins,
          dailySalary,
          earnedSalary,
          notes: record.notes || null,
        },
      });

      results.push(result);
    }

    return NextResponse.json({
      message: `${results.length} attendance records saved`,
      count: results.length,
    });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
