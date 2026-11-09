-- CreateTable
CREATE TABLE "LoginGuard" (
    "id" TEXT NOT NULL DEFAULT 'admin',
    "failed" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginGuard_pkey" PRIMARY KEY ("id")
);
