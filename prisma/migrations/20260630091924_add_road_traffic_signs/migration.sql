-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "series" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "drivingSchoolId" TEXT;

-- CreateTable
CREATE TABLE "DrivingSchool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrivingSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadTrafficSign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "RoadTrafficSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficSignFile" (
    "id" TEXT NOT NULL,
    "trafficSignId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "TrafficSignFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DrivingSchool_email_key" ON "DrivingSchool"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "DrivingSchool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadTrafficSign" ADD CONSTRAINT "RoadTrafficSign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficSignFile" ADD CONSTRAINT "TrafficSignFile_trafficSignId_fkey" FOREIGN KEY ("trafficSignId") REFERENCES "RoadTrafficSign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficSignFile" ADD CONSTRAINT "TrafficSignFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
