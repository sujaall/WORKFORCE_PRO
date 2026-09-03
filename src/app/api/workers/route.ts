import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { workerSchema } from "@/lib/validations";
import { generateWorkerId, calculateDailySalary } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "ACTIVE";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (status) {
      where.employmentStatus = status;
    }

    if (department) {
      where.department = department;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { workerId: { contains: search } },
        { mobileNumber: { contains: search } },
      ];
    }

    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.worker.count({ where }),
    ]);

    // Get today's attendance status for each worker
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: new Date(todayStr),
        workerId: { in: workers.map((w) => w.id) },
      },
    });

    const attendanceMap: Record<string, string> = {};
    todayAttendance.forEach((a) => {
      attendanceMap[a.workerId] = a.status;
    });

    const workersWithAttendance = workers.map((w) => ({
      ...w,
      todayStatus: attendanceMap[w.id] || "NOT_MARKED",
      dailySalary: calculateDailySalary(w.monthlySalary),
    }));

    return NextResponse.json({
      workers: workersWithAttendance,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Workers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = workerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Generate next worker ID
    const lastWorker = await prisma.worker.findFirst({
      orderBy: { workerId: "desc" },
      select: { workerId: true },
    });

    const workerId = generateWorkerId(lastWorker?.workerId || null);

    // Check duplicate mobile
    const existingMobile = await prisma.worker.findFirst({
      where: { mobileNumber: validation.data.mobileNumber },
    });

    if (existingMobile) {
      return NextResponse.json(
        { error: "A worker with this mobile number already exists" },
        { status: 400 }
      );
    }

    const worker = await prisma.worker.create({
      data: {
        workerId,
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

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error("Workers POST error:", error);
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 }
    );
  }
}
