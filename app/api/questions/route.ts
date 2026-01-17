import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Role } from "@prisma/client";
import cloudinary from "@/lib/cloudinary";

// Middleware check helper
const checkAuth = async () => {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return null; // Unauthorized - Only ADMIN and MANAGER can manage questions
    }
    return session;
}

const extractPublicId = (url: string) => {
    try {
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
};

export async function GET() {
    const users = await prisma.question.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
}

export async function POST(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { text, options, correctAnswer, image, series } = body;

    try {
        const question = await prisma.question.create({
            data: {
                text,
                options,
                correctAnswer,
                image: image || null,
                series: series || 1
            }
        });
        return NextResponse.json(question);
    } catch (e) {
        return NextResponse.json({ error: "Error creating question" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, text, options, correctAnswer, image, series } = body;

    try {
        // Get old question to check for old image
        const oldQuestion = await prisma.question.findUnique({ where: { id } });

        // If there's an old image and a new image is being set, delete the old one
        if (oldQuestion?.image && image && oldQuestion.image !== image) {
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
                image: image || null,
                series: series !== undefined ? series : 1
            }
        });
        return NextResponse.json(question);
    } catch (e) {
        return NextResponse.json({ error: "Error updating question" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    try {
        // Get question to check for image
        const question = await prisma.question.findUnique({ where: { id } });

        // Delete the question
        await prisma.question.delete({ where: { id } });

        // Delete associated image file from Cloudinary if it exists
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
    } catch (e) {
        return NextResponse.json({ error: "Error deleting question" }, { status: 500 });
    }
}
