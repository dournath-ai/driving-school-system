import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    try {
        const whereClause: any = {};
        if (start && end) {
            whereClause.startTime = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }

        // If student, only see own lessons? Or see all availability?
        // For now, let's return all scheduled lessons to show availability (busy slots)
        // In a real app, we might mask other student names.

        const lessons = await prisma.lesson.findMany({
            where: whereClause,
            include: {
                instructor: { select: { name: true } },
                student: { select: { name: true } },
                vehicle: { select: { model: true, plateNumber: true } },
            },
        });

        return NextResponse.json(lessons);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { instructorId, vehicleId, startTime, endTime } = body;

        // Basic validation
        if (!instructorId || !vehicleId || !startTime || !endTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check for conflicts (Instructor)
        const instructorConflict = await prisma.lesson.findFirst({
            where: {
                instructorId,
                status: 'SCHEDULED',
                OR: [
                    { startTime: { lte: new Date(startTime) }, endTime: { gt: new Date(startTime) } },
                    { startTime: { lt: new Date(endTime) }, endTime: { gte: new Date(endTime) } },
                ]
            }
        });

        if (instructorConflict) {
            return NextResponse.json({ error: "Instructor is not available at this time" }, { status: 409 });
        }

        // Check for conflicts (Vehicle)
        const vehicleConflict = await prisma.lesson.findFirst({
            where: {
                vehicleId,
                status: 'SCHEDULED',
                OR: [
                    { startTime: { lte: new Date(startTime) }, endTime: { gt: new Date(startTime) } },
                    { startTime: { lt: new Date(endTime) }, endTime: { gte: new Date(endTime) } },
                ]
            }
        });

        if (vehicleConflict) {
            return NextResponse.json({ error: "Vehicle is not available at this time" }, { status: 409 });
        }

        const lesson = await prisma.lesson.create({
            data: {
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                instructorId,
                vehicleId,
                studentId: session.user.id,
                status: 'SCHEDULED'
            }
        });

        return NextResponse.json(lesson);

    } catch (error) {
        console.error("Booking error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
