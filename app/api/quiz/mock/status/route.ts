import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { checkMockExamUnlock } from "@/lib/exam";

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const unlockStatus = await checkMockExamUnlock(session.user.id);
        return NextResponse.json(unlockStatus);
    } catch (error) {
        console.error("Error checking mock exam unlock status:", error);
        return NextResponse.json(
            { error: "Error checking unlock status" },
            { status: 500 }
        );
    }
}
