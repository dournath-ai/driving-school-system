import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");

    // Verify permissions (Admin or Manager)
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const where: any = {};

        // Handle Role filtering
        if (roleParam && Object.values(Role).includes(roleParam as Role)) {
            where.role = roleParam as Role;
        }

        // Handle Multi-tenancy Scoping
        if (session.user.role === Role.MANAGER) {
            // Managers can only see users from their own school
            where.drivingSchoolId = session.user.drivingSchoolId;
            // Managers typically manage Students (user request: "only his student")
            if (!roleParam) {
                where.role = Role.STUDENT;
            }
        }

        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                connectionLimit: true,
                createdAt: true,
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    // Verify permissions (Admin or Manager)
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        let { name, email, password, role, connectionLimit } = body;

        if (!email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Logic for Manager role
        let drivingSchoolId = body.drivingSchoolId;
        if (session.user.role === Role.MANAGER) {
            drivingSchoolId = session.user.drivingSchoolId;
            role = Role.STUDENT; // Overwrite role to Student for managers
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as Role,
                drivingSchoolId,
                connectionLimit: connectionLimit ? parseInt(connectionLimit) : null,
                isActive: true
            }
        });

        const { password: _, ...userWithoutPassword } = newUser;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
