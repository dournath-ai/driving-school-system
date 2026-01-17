import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    try {
        const where: any = {};

        if (session.user.role === "MANAGER") {
            if (userId) {
                // Check if target user belongs to manager's school
                const targetUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { drivingSchoolId: true }
                });

                if (!targetUser || targetUser.drivingSchoolId !== session.user.drivingSchoolId) {
                    return NextResponse.json({ error: "Access denied to this student's results" }, { status: 403 });
                }
                where.userId = userId;
            } else {
                // If no userId, get all results for the manager's school
                where.user = {
                    drivingSchoolId: session.user.drivingSchoolId
                };
            }
        } else if (session.user.role === "ADMIN") {
            if (userId) where.userId = userId;
            // Admin sees all if no userId
        } else {
            // Students only see their own
            where.userId = session.user.id;
        }

        const attempts = await prisma.quizAttempt.findMany({
            where,
            orderBy: { startTime: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        return NextResponse.json(attempts);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error fetching results" }, { status: 500 });
    }
}
