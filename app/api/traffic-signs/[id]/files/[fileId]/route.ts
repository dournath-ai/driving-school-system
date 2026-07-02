import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { Role } from "@prisma/client";
import cloudinary from "@/lib/cloudinary";

// Middleware check helper
const checkAuth = async () => {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return null;
    }
    return session;
};

// DELETE /api/traffic-signs/[id]/files/[fileId] - Delete a specific file (ADMIN/MANAGER only)
export async function DELETE(
    req: Request,
    { params }: { params: { id: string; fileId: string } }
) {
    const session = await checkAuth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: trafficSignId, fileId } = params;

        // Get the file to retrieve Cloudinary public ID
        const file = await prisma.trafficSignFile.findUnique({
            where: { id: fileId }
        });

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Verify the file belongs to the specified traffic sign
        if (file.trafficSignId !== trafficSignId) {
            return NextResponse.json({ error: "File does not belong to this traffic sign" }, { status: 400 });
        }

        // Delete file from Cloudinary
        try {
            await cloudinary.uploader.destroy(file.cloudinaryPublicId);
        } catch (err) {
            console.error(`Error deleting file ${file.cloudinaryPublicId} from Cloudinary:`, err);
            // Continue even if Cloudinary deletion fails
        }

        // Delete file record from database
        await prisma.trafficSignFile.delete({
            where: { id: fileId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json({ error: "Error deleting file" }, { status: 500 });
    }
}
