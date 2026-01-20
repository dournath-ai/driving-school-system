import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { Role } from "@prisma/client";

export async function GET(
    req: Request,
    { params }: { params: { attemptId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = params;

    try {
        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: attemptId },
            include: {
                user: true,
                results: {
                    include: {
                        question: true
                    }
                }
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        // Authorization checks
        const isOwner = attempt.userId === session.user.id;
        const isAdmin = session.user.role === Role.ADMIN;
        const isManager = session.user.role === Role.MANAGER;

        // If manager, check if student belongs to same school
        let hasAccess = isOwner || isAdmin;
        if (isManager && !hasAccess) {
            const student = await prisma.user.findUnique({
                where: { id: attempt.userId },
                select: { drivingSchoolId: true }
            });
            if (student && student.drivingSchoolId === session.user.drivingSchoolId) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Transform to ResultData format expected by frontend
        const questions = attempt.results.map(r => {
            return {
                id: r.question.id,
                text: r.question.text,
                image: r.question.image,
                options: r.question.options,
                correctAnswer: r.question.correctAnswer,
                selectedAnswer: r.selectedAnswer,
                isCorrect: r.isCorrect,
                hasAnswer: true // Since it's a result, we assume an answer was recorded (or handled as -1 if skipped, but model has Int)
            };
        });

        const resultData = {
            score: attempt.score,
            total: attempt.totalQuestions,
            passed: attempt.passed,
            questions: questions
        };

        return NextResponse.json(resultData);

    } catch (e) {
        console.error("Error fetching attempt details:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
