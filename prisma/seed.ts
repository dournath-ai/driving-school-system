import { PrismaClient, Role, VehicleStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)

    // System Settings
    await prisma.systemSettings.upsert({
        where: { id: 'settings' },
        update: {},
        create: {
            defaultConnectionLimit: 120, // 2 hours
            quizTimeLimit: 15,
            questionsPerQuiz: 30
        }
    })

    // Create Admin
    await prisma.user.upsert({
        where: { email: 'admin@driveschool.com' },
        update: { role: Role.ADMIN },
        create: {
            email: 'admin@driveschool.com',
            name: 'Admin User',
            password: hashedPassword,
            role: Role.ADMIN,
        },
    })

    // Create Manager
    await prisma.user.upsert({
        where: { email: 'manager@driveschool.com' },
        update: { role: Role.MANAGER },
        create: {
            email: 'manager@driveschool.com',
            name: 'School Manager',
            password: hashedPassword,
            role: Role.MANAGER,
        },
    })

    // Create Instructors
    await prisma.user.upsert({
        where: { email: 'john.doe@driveschool.com' },
        update: {},
        create: {
            email: 'john.doe@driveschool.com',
            name: 'John Doe',
            password: hashedPassword,
            role: Role.INSTRUCTOR,
        },
    })

    // Create Vehicles
    await prisma.vehicle.upsert({
        where: { plateNumber: 'ABC-123' },
        update: {},
        create: {
            model: 'Toyota Corolla 2024',
            plateNumber: 'ABC-123',
            status: VehicleStatus.ACTIVE,
        },
    })

    // Seed Questions (Sample of 5 for now)
    const questions = [
        {
            text: "What does a red traffic light mean?",
            options: ["Stop", "Go", "Yield", "Speed Up"],
            correctAnswer: 0,
            series: 1
        },
        {
            text: "When can you overtake on the left?",
            options: ["Assuming it is safe to do so", "Never", "Always", "Only on Sundays"],
            correctAnswer: 0,
            series: 1
        },
        {
            text: "What is the speed limit in urban areas (unless otherwise posted)?",
            options: ["30 km/h", "50 km/h", "70 km/h", "90 km/h"],
            correctAnswer: 1,
            series: 1
        },
        {
            text: "What does a flashing yellow light mean?",
            options: ["Stop", "Proceed with caution", "Go fast", "Turn around"],
            correctAnswer: 1,
            series: 1
        },
        {
            text: "Who has the right of way at a four-way stop?",
            options: ["The biggest car", "The person who arrived first", "The person to the left", "No one"],
            correctAnswer: 1,
            series: 1
        }
    ];

    for (const q of questions) {
        // Check if exists roughly by text (not efficient but fine for seed)
        const existing = await prisma.question.findFirst({ where: { text: q.text } });
        if (!existing) {
            await prisma.question.create({
                data: q
            })
        }
    }

    console.log("Database seeded successfully")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
