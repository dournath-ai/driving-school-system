import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VehicleStatus } from "@prisma/client";

export async function GET() {
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: {
                status: VehicleStatus.ACTIVE,
            },
        });
        return NextResponse.json(vehicles);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
