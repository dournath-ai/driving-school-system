import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = session.user.id;

        // Get all completed series for this user
        const completedAttempts = await prisma.quizAttempt.findMany({
            where: {
                userId,
                isMockExam: false,
                series: { not: null },
                themeId: null,
                passed: true
            },
            select: {
                series: true
            },
            distinct: ['series']
        });

        const completedSeries = new Set(completedAttempts.map(a => a.series).filter((s): s is number => s !== null));

        // Build series list (1-15)
        const series = Array.from({ length: 15 }, (_, i) => {
            const seriesNumber = i + 1;
            return {
                series: seriesNumber,
                completed: completedSeries.has(seriesNumber)
            };
        });

        // Count total questions per series
        const questionsPerSeries = await prisma.question.groupBy({
            by: ['series'],
            _count: {
                id: true
            },
            where: {
                series: { gte: 1, lte: 15 },
                themeId: null
            }
        });

        const questionsCountMap = new Map(questionsPerSeries.map(q => [q.series, q._count.id]));

        const seriesWithCounts = series.map(s => ({
            ...s,
            questionsCount: questionsCountMap.get(s.series) || 0
        }));

        // Check if all 15 series are completed
        const allCompleted = completedSeries.size === 15;

        return NextResponse.json({
            series: seriesWithCounts,
            allCompleted
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error fetching series" }, { status: 500 });
    }
}
