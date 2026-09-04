import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
    const date = new Date(dateStr + "T00:00:00.000Z");

    // Total active workers
    const totalWorkers = await prisma.worker.count({
      where: { employmentStatus: "ACTIVE" },
    });

    // Today's attendance
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: date,
      },
      include: {
        worker: {
          select: { fullName: true, workerId: true, department: true, profilePhoto: true },
        },
      },
    });

    const presentToday = todayAttendance.filter(
      (a) => a.status === "PRESENT" || a.status === "HALF_DAY"
    ).length;
    const absentToday = todayAttendance.filter((a) => a.status === "ABSENT").length;
    const onLeave = todayAttendance.filter((a) => a.status === "LEAVE").length;
    const onHoliday = todayAttendance.filter((a) => a.status === "HOLIDAY").length;
    const notMarked = totalWorkers - todayAttendance.length;

    const attendancePercentage =
      totalWorkers > 0
        ? Math.round((presentToday / totalWorkers) * 1000) / 10
        : 0;

    // Recent activity (last 10 attendance records)
    const recentActivity = await prisma.attendance.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        worker: {
          select: { fullName: true, workerId: true },
        },
      },
    });

    // Department-wise attendance for today
    const departments = await prisma.worker.groupBy({
      by: ["department"],
      where: { employmentStatus: "ACTIVE" },
      _count: { id: true },
    });

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const deptPresent = await prisma.attendance.count({
          where: {
            date: date,
            status: { in: ["PRESENT", "HALF_DAY"] },
            worker: { department: dept.department },
          },
        });
        return {
          department: dept.department,
          total: dept._count.id,
          present: deptPresent,
        };
      })
    );

    // Monthly trend (last 30 days)
    const thirtyDaysAgo = subDays(date, 29);
    const monthlyAttendance = await prisma.attendance.groupBy({
      by: ["date", "status"],
      where: {
        date: {
          gte: thirtyDaysAgo,
          lte: date,
        },
      },
      _count: { id: true },
    });

    const trendMap: Record<string, { present: number; absent: number; leave: number }> = {};
    monthlyAttendance.forEach((record) => {
      const day = format(new Date(record.date), "yyyy-MM-dd");
      if (!trendMap[day]) trendMap[day] = { present: 0, absent: 0, leave: 0 };
      if (record.status === "PRESENT" || record.status === "HALF_DAY") {
        trendMap[day].present += record._count.id;
      } else if (record.status === "ABSENT") {
        trendMap[day].absent += record._count.id;
      } else if (record.status === "LEAVE") {
        trendMap[day].leave += record._count.id;
      }
    });

    const monthlyTrend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date: format(new Date(date), "dd MMM"),
        ...counts,
      }));

    return NextResponse.json({
      totalWorkers,
      presentToday,
      absentToday,
      onLeave,
      onHoliday,
      notMarked,
      attendancePercentage,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        workerName: a.worker.fullName,
        workerId: a.worker.workerId,
        status: a.status,
        checkIn: a.checkInTime,
        checkOut: a.checkOutTime,
        date: format(new Date(a.date), "dd MMM yyyy"),
        updatedAt: a.updatedAt,
      })),
      departmentStats,
      monthlyTrend,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
