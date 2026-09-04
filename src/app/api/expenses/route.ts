import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getWeekNumber(day: number): number {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId") || "";
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || "0");

    const where: any = {};

    if (workerId) {
      where.workerId = workerId;
    }
    if (month) {
      where.month = month;
    }
    if (year) {
      where.year = year;
    }

    const expenses = await prisma.workerExpense.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        worker: {
          select: { fullName: true, workerId: true },
        },
      },
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({ expenses, total });
  } catch (error) {
    console.error("Expenses GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workerId, amount, date, note } = body;

    if (!workerId || !amount || !date) {
      return NextResponse.json(
        { error: "workerId, amount, and date are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Verify worker exists
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Worker not found" },
        { status: 404 }
      );
    }

    const parsedDate = new Date(date);
    const day = parsedDate.getUTCDate();
    const month = parsedDate.getUTCMonth() + 1;
    const year = parsedDate.getUTCFullYear();
    const weekNumber = getWeekNumber(day);

    const expense = await prisma.workerExpense.create({
      data: {
        workerId,
        amount: Math.round(parseFloat(amount.toString())),
        date: parsedDate,
        weekNumber,
        month,
        year,
        note: note || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Expenses POST error:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
