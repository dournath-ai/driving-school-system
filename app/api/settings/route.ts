import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Role } from "@prisma/client";

export async function GET() {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: "settings" }
        });

        return NextResponse.json(settings || {
            questionsPerQuiz: 30,
            quizTimeLimit: 900,
            questionTimeLimit: 30
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Error fetching settings" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    // Only ADMIN can update settings
    if (!session || session.user.role !== Role.ADMIN) {
        return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Convert to numbers and validate
        const questionsPerQuiz = Number(body.questionsPerQuiz);
        const quizTimeLimit = Number(body.quizTimeLimit);
        const questionTimeLimit = Number(body.questionTimeLimit);

        console.log("Received settings:", { questionsPerQuiz, quizTimeLimit, questionTimeLimit });

        // Validate input
        if (isNaN(questionsPerQuiz) || questionsPerQuiz < 5 || questionsPerQuiz > 100) {
            console.error("Invalid questionsPerQuiz:", body.questionsPerQuiz);
            return NextResponse.json({ error: "Questions per quiz must be between 5 and 100" }, { status: 400 });
        }

        if (isNaN(quizTimeLimit) || quizTimeLimit < 60 || quizTimeLimit > 7200) {
            console.error("Invalid quizTimeLimit:", body.quizTimeLimit);
            return NextResponse.json({ error: "Quiz time limit must be between 60 and 7200 seconds" }, { status: 400 });
        }

        if (isNaN(questionTimeLimit) || questionTimeLimit < 10 || questionTimeLimit > 120) {
            console.error("Invalid questionTimeLimit:", body.questionTimeLimit);
            return NextResponse.json({ error: "Question time limit must be between 10 and 120 seconds" }, { status: 400 });
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: "settings" },
            update: {
                questionsPerQuiz,
                quizTimeLimit,
                questionTimeLimit
            },
            create: {
                id: "settings",
                questionsPerQuiz,
                quizTimeLimit,
                questionTimeLimit
            }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Error updating settings" },
            { status: 500 }
        );
    }
}
