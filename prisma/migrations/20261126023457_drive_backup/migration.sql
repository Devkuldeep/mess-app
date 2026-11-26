-- CreateEnum
CREATE TYPE "DriveStatus" AS ENUM ('active', 'needs_reconnect');

-- CreateTable
CREATE TABLE "DriveConnection" (
    "orgId" UUID NOT NULL,
    "googleEmail" TEXT,
    "refreshTokenEnc" TEXT NOT NULL,
    "folderId" TEXT,
    "status" "DriveStatus" NOT NULL DEFAULT 'active',
    "connectedBy" UUID,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "lastBackupAt" TIMESTAMP(3),
    "lastBackupName" TEXT,
    "lastError" TEXT,

    CONSTRAINT "DriveConnection_pkey" PRIMARY KEY ("orgId")
);

-- AddForeignKey
ALTER TABLE "DriveConnection" ADD CONSTRAINT "DriveConnection_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
