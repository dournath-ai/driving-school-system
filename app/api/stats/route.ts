import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Role } from "@prisma/client";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        if (session.user.role === Role.MANAGER) {
            const drivingSchoolId = session.user.drivingSchoolId;
            const studentsCount = await prisma.user.count({
                where: {
                    role: Role.STUDENT,
                    drivingSchoolId
                }
            });
            const lessonsCount = await prisma.lesson.count({
                where: {
                    drivingSchoolId
                }
            });
            const quizAttemptsCount = await prisma.quizAttempt.count({
                where: {
                    user: { drivingSchoolId }
                }
            });

            const recentAttempts = await prisma.quizAttempt.findMany({
                take: 5,
                where: { user: { drivingSchoolId } },
                orderBy: { startTime: 'desc' },
                include: { user: { select: { name: true } } }
            });

            return NextResponse.json({
                stats: {
                    students: studentsCount,
                    lessons: lessonsCount,
                    attempts: quizAttemptsCount
                },
                recentAttempts
            });
        }

        const schoolsCount = await prisma.drivingSchool.count();
        const managersCount = await prisma.user.count({ where: { role: Role.MANAGER } });
        const studentsCount = await prisma.user.count({ where: { role: Role.STUDENT } });
        const questionsCount = await prisma.question.count();

        // Recent activity: let's combine recent users and recent schools for now
        const recentSchools = await prisma.drivingSchool.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, createdAt: true }
        });

        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });

        return NextResponse.json({
            stats: {
                schools: schoolsCount,
                managers: managersCount,
                students: studentsCount,
                questions: questionsCount
            },
            recentSchools,
            recentUsers
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
