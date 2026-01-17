import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // Increment totalConnectionTime by 1 minute
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                totalConnectionTime: {
                    increment: 1
                }
            },
            select: {
                isActive: true,
                connectionLimit: true,
                totalConnectionTime: true,
                role: true
            }
        });

        // 1. Check if account was deactivated while logged in
        if (!user.isActive) {
            return NextResponse.json({
                status: "DEACTIVATED",
                message: "Votre compte a été désactivé."
            }, { status: 403 });
        }

        // 2. Check connection limit (only for non-ADMINs, for example, or all)
        // Let's assume ADMINs are exempt, but user request implies it's generic
        if (user.role !== "ADMIN" && user.connectionLimit !== null) {
            if (user.totalConnectionTime >= user.connectionLimit) {
                return NextResponse.json({
                    status: "LIMIT_EXCEEDED",
                    message: "Votre limite de temps de connexion est atteinte."
                }, { status: 403 });
            }
        }

        return NextResponse.json({
            status: "OK",
            remaining: user.connectionLimit ? user.connectionLimit - user.totalConnectionTime : null
        });

    } catch (error) {
        console.error("Heartbeat error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
