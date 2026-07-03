import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { selectQuestionsForMockExam } from "@/lib/exam";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        // Validate: either series (1-15), themeId, or isMockExam should be provided
        const { series, isMockExam, themeId } = body;

        if (!isMockExam && !themeId && (!series || series < 1 || series > 15)) {
            return NextResponse.json({ error: "Invalid series number (must be 1-15)" }, { status: 400 });
        }

        if (themeId && isMockExam) {
            return NextResponse.json({ error: "Cannot start mock exam with a theme" }, { status: 400 });
        }

        if (themeId && series) {
            return NextResponse.json({ error: "Cannot specify both theme and series" }, { status: 400 });
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
            // Mock exam: balanced random 30 questions from all series using stratified sampling
            const questionIds = await selectQuestionsForMockExam(questionsCount);
            selectedQuestions = questionIds.map(id => ({ id }));
        } else if (themeId) {
            const themeQuestions = await prisma.question.findMany({
                where: { themeId },
                select: { id: true }
            });

            if (themeQuestions.length === 0) {
                return NextResponse.json({ error: "No questions found for this theme" }, { status: 404 });
            }

            const shuffled = themeQuestions.sort(() => 0.5 - Math.random());
            selectedQuestions = shuffled.slice(0, Math.min(questionsCount, shuffled.length));
        } else {
            // Series quiz: all questions from the specified series (excluding theme questions)
            const seriesQuestions = await prisma.question.findMany({
                where: { series, themeId: null },
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
                series: isMockExam || themeId ? null : series,
                themeId: themeId || null,
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
