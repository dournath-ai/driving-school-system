import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { series, isMockExam } = body;

        // Validate: either series (1-15) or isMockExam should be provided
        if (!isMockExam && (!series || series < 1 || series > 15)) {
            return NextResponse.json({ error: "Invalid series number (must be 1-15)" }, { status: 400 });
        }

        // Fetch dynamic settings
        const settings = await prisma.systemSettings.findUnique({
            where: { id: "settings" }
        }) || {
            questionsPerQuiz: 30,
            quizTimeLimit: 900,
            questionTimeLimit: 30
        };

        const questionsCount = settings.questionsPerQuiz;

        let selectedQuestions;

        if (isMockExam) {
            // Mock exam: random 30 questions from all questions
            const allQuestions = await prisma.question.findMany({ select: { id: true } });
            const shuffled = allQuestions.sort(() => 0.5 - Math.random());
            selectedQuestions = shuffled.slice(0, questionsCount);
        } else {
            // Series quiz: all questions from the specified series
            const seriesQuestions = await prisma.question.findMany({
                where: { series },
                select: { id: true }
            });
            
            if (seriesQuestions.length === 0) {
                return NextResponse.json({ error: `No questions found for series ${series}` }, { status: 404 });
            }

            // Shuffle questions from the series
            const shuffled = seriesQuestions.sort(() => 0.5 - Math.random());
            selectedQuestions = shuffled.slice(0, Math.min(questionsCount, shuffled.length));
        }

        const attempt = await prisma.quizAttempt.create({
            data: {
                userId: session.user.id,
                totalQuestions: selectedQuestions.length,
                score: 0,
                passed: false,
                series: isMockExam ? null : series,
                isMockExam: isMockExam || false,
                startTime: new Date()
            }
        });

        const fullQuestions = await prisma.question.findMany({
            where: {
                id: { in: selectedQuestions.map(q => q.id) }
            },
            select: {
                id: true,
                text: true,
                options: true,
                image: true
            }
        });

        return NextResponse.json({
            attemptId: attempt.id,
            questions: fullQuestions,
            settings: {
                quizTimeLimit: settings.quizTimeLimit,
                questionTimeLimit: settings.questionTimeLimit
            }
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error starting quiz" }, { status: 500 });
    }
}
