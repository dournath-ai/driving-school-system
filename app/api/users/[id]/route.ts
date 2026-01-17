import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Role } from "@prisma/client";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    // Verify permissions (Admin or Manager)
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const body = await req.json();
    let { name, email, role, isActive, connectionLimit } = body;

    try {
        // Fetch user to check ownership
        const userToUpdate = await prisma.user.findUnique({
            where: { id: userId },
            select: { drivingSchoolId: true, role: true }
        });

        if (!userToUpdate) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (session.user.role === Role.MANAGER) {
            if (userToUpdate.drivingSchoolId !== session.user.drivingSchoolId) {
                return NextResponse.json({ error: "Forbidden: Not your student" }, { status: 403 });
            }
            // Managers can only manage STUDENTS
            if (userToUpdate.role !== Role.STUDENT) {
                return NextResponse.json({ error: "Forbidden: You can only modify students" }, { status: 403 });
            }
            // Force role to STUDENT for managers
            if (role) {
                role = Role.STUDENT;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                role: role as Role,
                isActive,
                connectionLimit: connectionLimit !== undefined ? (connectionLimit ? parseInt(connectionLimit) : null) : undefined
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    // Verify permissions (Admin or Manager)
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    try {
        // Fetch user to check ownership
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
            select: { drivingSchoolId: true, role: true }
        });

        if (!userToDelete) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Managers can only delete students from their own school
        if (session.user.role === Role.MANAGER) {
            if (userToDelete.drivingSchoolId !== session.user.drivingSchoolId) {
                return NextResponse.json({ error: "Forbidden: Not your student" }, { status: 403 });
            }
            // Managers can only delete STUDENTS
            if (userToDelete.role !== Role.STUDENT) {
                return NextResponse.json({ error: "Forbidden: You can only delete students" }, { status: 403 });
            }
        }

        // Don't allow deleting self
        if (session.user.id === userId) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
