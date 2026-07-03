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

        const themes = await prisma.theme.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: { select: { questions: true } }
            }
        });

        const completedAttempts = await prisma.quizAttempt.findMany({
            where: {
                userId,
                themeId: { not: null },
                passed: true,
                isMockExam: false
            },
            select: { themeId: true },
            distinct: ["themeId"]
        });

        const completedThemeIds = new Set(
            completedAttempts.map(a => a.themeId).filter((id): id is string => id !== null)
        );

        const themesWithStatus = themes.map(theme => ({
            id: theme.id,
            name: theme.name,
            description: theme.description,
            image: theme.image,
            questionsCount: theme._count.questions,
            completed: completedThemeIds.has(theme.id)
        }));

        return NextResponse.json({ themes: themesWithStatus });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error fetching themes" }, { status: 500 });
    }
}
