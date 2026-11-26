-- CreateEnum
CREATE TYPE "DishUnit" AS ENUM ('kg', 'litre', 'count');

-- CreateEnum
CREATE TYPE "WasteReason" AS ENUM ('none', 'late_skip', 'not_taken', 'disliked', 'overcooked', 'other');

-- AlterTable
ALTER TABLE "Org" ADD COLUMN     "wastageTargetPct" SMALLINT NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "Dish" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "DishUnit" NOT NULL,
    "perTiffin" DECIMAL(8,3) NOT NULL,
    "costPerUnit" DECIMAL(10,2),
    "variety" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WastageEntry" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "meal" "Meal" NOT NULL,
    "tiffins" INTEGER NOT NULL,
    "reason" "WasteReason" NOT NULL DEFAULT 'none',
    "note" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WastageEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WastageItem" (
    "orgId" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "dishId" UUID NOT NULL,
    "label" TEXT,
    "cooked" DECIMAL(10,3) NOT NULL,
    "leftover" DECIMAL(10,3) NOT NULL,
    "costPerUnit" DECIMAL(10,2),

    CONSTRAINT "WastageItem_pkey" PRIMARY KEY ("entryId","dishId")
);

-- CreateIndex
CREATE INDEX "Dish_orgId_idx" ON "Dish"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Dish_orgId_name_key" ON "Dish"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Dish_orgId_id_key" ON "Dish"("orgId", "id");

-- CreateIndex
CREATE INDEX "WastageEntry_orgId_date_idx" ON "WastageEntry"("orgId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WastageEntry_orgId_date_meal_key" ON "WastageEntry"("orgId", "date", "meal");

-- CreateIndex
CREATE UNIQUE INDEX "WastageEntry_orgId_id_key" ON "WastageEntry"("orgId", "id");

-- CreateIndex
CREATE INDEX "WastageItem_orgId_dishId_idx" ON "WastageItem"("orgId", "dishId");

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WastageEntry" ADD CONSTRAINT "WastageEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WastageItem" ADD CONSTRAINT "WastageItem_orgId_entryId_fkey" FOREIGN KEY ("orgId", "entryId") REFERENCES "WastageEntry"("orgId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WastageItem" ADD CONSTRAINT "WastageItem_orgId_dishId_fkey" FOREIGN KEY ("orgId", "dishId") REFERENCES "Dish"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
