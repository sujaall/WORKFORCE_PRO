import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { workerSchema } from "@/lib/validations";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { calculateDailySalary } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: params.id },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Get current month attendance stats
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const attendance = await prisma.attendance.findMany({
      where: {
        workerId: worker.id,
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    const presentDays = attendance.filter(
      (a) => a.status === "PRESENT"
    ).length;
    const absentDays = attendance.filter((a) => a.status === "ABSENT").length;
    const leaveDays = attendance.filter((a) => a.status === "LEAVE").length;
    const halfDays = attendance.filter((a) => a.status === "HALF_DAY").length;
    const holidayDays = attendance.filter(
      (a) => a.status === "HOLIDAY"
    ).length;
    const totalMarked = attendance.length;
    const attendancePercentage =
      totalMarked > 0
        ? Math.round(((presentDays + halfDays * 0.5) / totalMarked) * 1000) / 10
        : 0;

    return NextResponse.json({
      ...worker,
      dailySalary: calculateDailySalary(worker.monthlySalary),
      stats: {
        presentDays,
        absentDays,
        leaveDays,
        halfDays,
        holidayDays,
        totalMarked,
        attendancePercentage,
      },
    });
  } catch (error) {
    console.error("Worker GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch worker" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const worker = await prisma.worker.findUnique({
      where: { id: params.id },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Handle status change (activate/deactivate)
    if (body.employmentStatus !== undefined) {
      const updated = await prisma.worker.update({
        where: { id: params.id },
        data: { employmentStatus: body.employmentStatus },
      });
      return NextResponse.json(updated);
    }

    const validation = workerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.worker.update({
      where: { id: params.id },
      data: {
        fullName: validation.data.fullName,
        mobileNumber: validation.data.mobileNumber,
        alternateMobile: validation.data.alternateMobile,
        dateOfBirth: validation.data.dateOfBirth
          ? new Date(validation.data.dateOfBirth)
          : null,
        gender: validation.data.gender,
        address: validation.data.address,
        department: validation.data.department,
        designation: validation.data.designation,
        workerType: validation.data.workerType,
        joiningDate: new Date(validation.data.joiningDate),
        monthlySalary: validation.data.monthlySalary,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Worker PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update worker" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete - just deactivate
    const updated = await prisma.worker.update({
      where: { id: params.id },
      data: { employmentStatus: "INACTIVE" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Worker DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate worker" },
      { status: 500 }
    );
  }
}
