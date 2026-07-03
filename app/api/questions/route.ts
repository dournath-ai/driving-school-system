import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Role } from "@prisma/client";
import cloudinary from "@/lib/cloudinary";

const checkAuth = async () => {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return null;
    }
    return session;
};

const extractPublicId = (url: string) => {
    try {
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const themeId = url.searchParams.get("themeId");
    const series = url.searchParams.get("series");

    const where: Record<string, unknown> = {};

    if (themeId) {
        where.themeId = themeId;
    } else if (series) {
        where.series = parseInt(series);
        where.themeId = null;
    } else {
        where.themeId = null;
    }

    const questions = await prisma.question.findMany({
        where,
        orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(questions);
}

export async function POST(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { text, options, correctAnswer, image, series, themeId } = body;

    if (themeId) {
        if (series !== null && series !== undefined) {
            return NextResponse.json({ error: "Theme questions cannot be assigned to a series" }, { status: 400 });
        }
    } else {
        if (!series || series < 1 || series > 15) {
            return NextResponse.json({ error: "Series questions must have a series between 1 and 15" }, { status: 400 });
        }
    }

    try {
        const question = await prisma.question.create({
            data: {
                text,
                options,
                correctAnswer,
                image: image || null,
                series: themeId ? null : series,
                themeId: themeId || null
            }
        });
        return NextResponse.json(question);
    } catch {
        return NextResponse.json({ error: "Error creating question" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, text, options, correctAnswer, image, series, themeId } = body;

    try {
        const oldQuestion = await prisma.question.findUnique({ where: { id } });
        if (!oldQuestion) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        const effectiveThemeId = themeId !== undefined ? themeId : oldQuestion.themeId;
        const effectiveSeries = series !== undefined ? series : oldQuestion.series;

        if (effectiveThemeId) {
            if (effectiveSeries !== null) {
                return NextResponse.json({ error: "Theme questions cannot be assigned to a series" }, { status: 400 });
            }
        } else {
            if (!effectiveSeries || effectiveSeries < 1 || effectiveSeries > 15) {
                return NextResponse.json({ error: "Series questions must have a series between 1 and 15" }, { status: 400 });
            }
        }

        if (oldQuestion.image && image && oldQuestion.image !== image) {
            const publicId = extractPublicId(oldQuestion.image);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.error("Error deleting old image from Cloudinary:", err);
                }
            }
        }

        const question = await prisma.question.update({
            where: { id },
            data: {
                text,
                options,
                correctAnswer,
                image: image !== undefined ? image : oldQuestion.image,
                series: effectiveThemeId ? null : effectiveSeries,
                themeId: effectiveThemeId
            }
        });
        return NextResponse.json(question);
    } catch {
        return NextResponse.json({ error: "Error updating question" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    try {
        const question = await prisma.question.findUnique({ where: { id } });

        await prisma.question.delete({ where: { id } });

        if (question?.image) {
            const publicId = extractPublicId(question.image);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.error("Error deleting image from Cloudinary:", err);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Error deleting question" }, { status: 500 });
    }
}
