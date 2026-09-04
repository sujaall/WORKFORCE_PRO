import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { workerId: string } }
) {
  try {
    const { workerId } = params;

    const payouts = await prisma.payoutRecord.findMany({
      where: { workerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        worker: {
          select: { fullName: true, workerId: true },
        },
      },
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error("Payouts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}
