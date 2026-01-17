import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { attemptId, answers, questionIds } = body; 
    // answers: { questionId: selectedOptionIndex }
    // questionIds: array of all question IDs in the quiz

    try {
        // Fetch the attempt
        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: attemptId }
        });

        if (!attempt) {
            return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
        }

        // Get all question IDs (from questionIds parameter or from answers keys)
        const allQuestionIds = questionIds && questionIds.length > 0 
            ? questionIds 
            : Object.keys(answers);
        
        if (!allQuestionIds || allQuestionIds.length === 0) {
            return NextResponse.json({ error: "No questions provided" }, { status: 400 });
        }

        // Fetch all questions from the quiz
        const allQuestions = await prisma.question.findMany({
            where: {
                id: { in: allQuestionIds }
            },
            select: {
                id: true,
                text: true,
                options: true,
                image: true,
                correctAnswer: true
            }
        });

        let score = 0;
        const resultsData = [];
        const questionDetails: any[] = [];

        // Process ALL questions, even unanswered ones
        for (const question of allQuestions) {
            // Check if question has an answer (0 is a valid answer index, so we check for undefined/null)
            const selectedIdx = answers[question.id];
            const hasAnswer = selectedIdx !== undefined && selectedIdx !== null && typeof selectedIdx === 'number';
            const isCorrect = hasAnswer && question.correctAnswer === selectedIdx;
            
            if (isCorrect) score++;
            
            // Store result data (use -1 to indicate no answer)
            resultsData.push({
                attemptId,
                questionId: question.id,
                selectedAnswer: hasAnswer ? (selectedIdx as number) : -1,
                isCorrect
            });
            
            // Store question details for the response
            questionDetails.push({
                id: question.id,
                text: question.text,
                options: question.options,
                image: question.image,
                correctAnswer: question.correctAnswer,
                selectedAnswer: hasAnswer ? selectedIdx : null,
                isCorrect,
                hasAnswer
            });
        }
        
        const total = allQuestions.length;
        
        // Save results (delete old ones first if they exist)
        await prisma.quizResult.deleteMany({ where: { attemptId } });
        if (resultsData.length > 0) {
            await prisma.quizResult.createMany({ data: resultsData });
        }
        
        // Update Attempt
        const passed = total > 0 && (score / total) >= 0.8; // 80% pass rate

        await prisma.quizAttempt.update({
            where: { id: attemptId },
            data: {
                score,
                totalQuestions: total,
                endTime: new Date(),
                passed
            }
        });

        return NextResponse.json({ 
            score, 
            total, 
            passed,
            questions: questionDetails
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error submitting quiz" }, { status: 500 });
    }
}
