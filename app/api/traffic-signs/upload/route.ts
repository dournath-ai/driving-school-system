import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Role } from "@prisma/client";
import cloudinary from "@/lib/cloudinary";

// Middleware check helper - only ADMIN and MANAGER can upload files
const checkAuth = async () => {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return null;
    }
    return session;
};

// POST /api/traffic-signs/upload - Upload file to traffic sign (ADMIN/MANAGER only)
export async function POST(req: Request) {
    const session = await checkAuth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const trafficSignId = formData.get("trafficSignId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!trafficSignId) {
            return NextResponse.json({ error: "Traffic sign ID is required" }, { status: 400 });
        }

        // Verify traffic sign exists
        const trafficSign = await prisma.roadTrafficSign.findUnique({
            where: { id: trafficSignId }
        });

        if (!trafficSign) {
            return NextResponse.json({ error: "Traffic sign not found" }, { status: 404 });
        }

        // Validate file type - allow images and PDFs
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "application/pdf"
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only images (PNG, JPG, GIF, WEBP, SVG) and PDFs are allowed." },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB for documents)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB." },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Determine resource type based on file type
        const resourceType = file.type === "application/pdf" ? "raw" : "image";

        // Upload to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "traffic-signs",
                    public_id: `${trafficSignId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    overwrite: false,
                    resource_type: resourceType
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        // Store file metadata in database
        const trafficSignFile = await prisma.trafficSignFile.create({
            data: {
                trafficSignId,
                fileUrl: result.secure_url,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                cloudinaryPublicId: result.public_id,
                uploadedById: session.user.id
            }
        });

        return NextResponse.json({
            success: true,
            file: trafficSignFile,
            fileUrl: result.secure_url
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "Error uploading file" }, { status: 500 });
    }
}
