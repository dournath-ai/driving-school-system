import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Role } from "@prisma/client";

// Middleware check helper - only ADMIN and MANAGER can create/update/delete
const checkAuth = async () => {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return null;
    }
    return session;
};

// GET /api/traffic-signs - Public endpoint to view all traffic signs with files
export async function GET() {
    try {
        const trafficSigns = await prisma.roadTrafficSign.findMany({
            include: {
                files: {
                    orderBy: { uploadedAt: 'desc' }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(trafficSigns);
    } catch (error) {
        console.error("Error fetching traffic signs:", error);
        return NextResponse.json({ error: "Error fetching traffic signs" }, { status: 500 });
    }
}

// POST /api/traffic-signs - Create new traffic sign (ADMIN/MANAGER only)
export async function POST(req: Request) {
    const session = await checkAuth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, description, category, code } = body;

        // Validate required fields
        if (!title || !title.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const trafficSign = await prisma.roadTrafficSign.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                category: category?.trim() || null,
                code: code?.trim() || null,
                createdById: session.user.id
            },
            include: {
                files: true,
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(trafficSign, { status: 201 });
    } catch (error) {
        console.error("Error creating traffic sign:", error);
        return NextResponse.json({ error: "Error creating traffic sign" }, { status: 500 });
    }
}

// PATCH /api/traffic-signs - Update traffic sign metadata (ADMIN/MANAGER only)
export async function PATCH(req: Request) {
    const session = await checkAuth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, title, description, category, code } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        if (!title || !title.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Verify traffic sign exists
        const existing = await prisma.roadTrafficSign.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Traffic sign not found" }, { status: 404 });
        }

        const trafficSign = await prisma.roadTrafficSign.update({
            where: { id },
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                category: category?.trim() || null,
                code: code?.trim() || null
            },
            include: {
                files: true,
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(trafficSign);
    } catch (error) {
        console.error("Error updating traffic sign:", error);
        return NextResponse.json({ error: "Error updating traffic sign" }, { status: 500 });
    }
}

// DELETE /api/traffic-signs - Delete traffic sign and all associated files (ADMIN/MANAGER only)
export async function DELETE(req: Request) {
    const session = await checkAuth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Get traffic sign with all files to clean up Cloudinary
        const trafficSign = await prisma.roadTrafficSign.findUnique({
            where: { id },
            include: { files: true }
        });

        if (!trafficSign) {
            return NextResponse.json({ error: "Traffic sign not found" }, { status: 404 });
        }

        // Delete files from Cloudinary
        const cloudinary = (await import('@/lib/cloudinary')).default;
        for (const file of trafficSign.files) {
            try {
                await cloudinary.uploader.destroy(file.cloudinaryPublicId);
            } catch (err) {
                console.error(`Error deleting file ${file.cloudinaryPublicId} from Cloudinary:`, err);
                // Continue even if deletion fails
            }
        }

        // Delete traffic sign (cascades to files in DB)
        await prisma.roadTrafficSign.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting traffic sign:", error);
        return NextResponse.json({ error: "Error deleting traffic sign" }, { status: 500 });
    }
}
