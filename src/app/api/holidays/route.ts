import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { holidaySchema } from "@/lib/validations";

export async function GET() {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json({ holidays });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = holidaySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        holidayName: validation.data.holidayName,
        date: new Date(validation.data.date + "T00:00:00.000Z"),
        description: validation.data.description,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A holiday already exists on this date" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ message: "Holiday deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 });
  }
}
