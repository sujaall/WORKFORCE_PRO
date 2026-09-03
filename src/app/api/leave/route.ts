import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leaveSchema } from "@/lib/validations";
import { eachDayOfInterval, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");

    const where: any = {};
    if (workerId) where.workerId = workerId;

    const leaves = await prisma.leave.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        worker: { select: { fullName: true, workerId: true, department: true } },
      },
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = leaveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { workerId, startDate, endDate, leaveType, reason } = validation.data;

    const leave = await prisma.leave.create({
      data: {
        workerId,
        startDate: new Date(startDate + "T00:00:00.000Z"),
        endDate: new Date(endDate + "T00:00:00.000Z"),
        leaveType,
        reason,
      },
    });

    // Auto-mark attendance as LEAVE for each day in the range
    const days = eachDayOfInterval({
      start: new Date(startDate),
      end: new Date(endDate),
    });

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (worker) {
      for (const day of days) {
        const date = new Date(format(day, "yyyy-MM-dd") + "T00:00:00.000Z");
        await prisma.attendance.upsert({
          where: { workerId_date: { workerId, date } },
          update: { status: "LEAVE", earnedSalary: 0 },
          create: {
            workerId,
            date,
            status: "LEAVE",
            dailySalary: worker.monthlySalary / 30,
            earnedSalary: 0,
          },
        });
      }
    }

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error("Leave POST error:", error);
    return NextResponse.json({ error: "Failed to create leave" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.leave.delete({ where: { id } });
    return NextResponse.json({ message: "Leave deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete leave" }, { status: 500 });
  }
}
