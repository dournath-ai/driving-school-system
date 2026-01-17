import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Prisma.Role.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    try {
        const schools = await prisma.drivingSchool.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { users: true }
                },
                users: {
                    where: { role: Prisma.Role.MANAGER },
                    select: { id: true, name: true, email: true }
                }
            }
        });
        return NextResponse.json(schools);
    } catch (error) {
        console.error("Error fetching schools:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Prisma.Role.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, address, phone, email, managerId } = body;

        if (!name) {
            return NextResponse.json({ error: "Nom de l'auto-école manquant" }, { status: 400 });
        }

        // Use a transaction to create school and assign manager
        const school = await prisma.$transaction(async (tx) => {
            const newSchool = await tx.drivingSchool.create({
                data: {
                    name,
                    address,
                    phone,
                    email
                }
            });

            if (managerId) {
                await tx.user.update({
                    where: { id: managerId },
                    data: { drivingSchoolId: newSchool.id }
                });
            }

            return newSchool;
        });

        return NextResponse.json(school);
    } catch (error) {
        console.error("Error creating school:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Prisma.Role.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, address, phone, email, managerId } = body;

        if (!id || !name) {
            return NextResponse.json({ error: "ID et nom de l'auto-école requis" }, { status: 400 });
        }

        // Use a transaction to update school and manager
        const school = await prisma.$transaction(async (tx) => {
            // Update school
            const updatedSchool = await tx.drivingSchool.update({
                where: { id },
                data: {
                    name,
                    address,
                    phone,
                    email
                },
                include: {
                    _count: {
                        select: { users: true }
                    },
                    users: {
                        where: { role: Prisma.Role.MANAGER },
                        select: { id: true, name: true, email: true }
                    }
                }
            });

            // Handle manager assignment
            if (managerId) {
                // Remove old manager assignment
                const oldManager = await tx.user.findFirst({
                    where: { drivingSchoolId: id, role: Prisma.Role.MANAGER }
                });
                
                if (oldManager && oldManager.id !== managerId) {
                    await tx.user.update({
                        where: { id: oldManager.id },
                        data: { drivingSchoolId: null }
                    });
                }

                // Assign new manager
                await tx.user.update({
                    where: { id: managerId },
                    data: { drivingSchoolId: id }
                });
            }

            return updatedSchool;
        });

        return NextResponse.json(school);
    } catch (error) {
        console.error("Error updating school:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Prisma.Role.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID manquant" }, { status: 400 });
        }

        // Check if school has users
        const school = await prisma.drivingSchool.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });

        if (!school) {
            return NextResponse.json({ error: "Auto-école non trouvée" }, { status: 404 });
        }

        if (school._count.users > 0) {
            return NextResponse.json({ 
                error: "Impossible de supprimer une auto-école avec des utilisateurs. Veuillez d'abord réassigner ou supprimer les utilisateurs." 
            }, { status: 400 });
        }

        await prisma.drivingSchool.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting school:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}