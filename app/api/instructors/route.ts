import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
    try {
        const instructors = await prisma.user.findMany({
            where: {
                role: Role.INSTRUCTOR,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });
        return NextResponse.json(instructors);
    } catch (error) {
        console.error("Error fetching instructors:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
