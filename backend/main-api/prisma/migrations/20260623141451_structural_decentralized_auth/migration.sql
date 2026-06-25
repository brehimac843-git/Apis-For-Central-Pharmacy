-- CreateTable
CREATE TABLE "pharmacies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "amo_supported" BOOLEAN NOT NULL,
    "api_url" TEXT NOT NULL,

    CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_visibilities" (
    "id" TEXT NOT NULL,
    "pharmacyId" INTEGER NOT NULL,
    "drugName" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "drug_visibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "central_admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "central_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drug_visibilities_pharmacyId_drugName_key" ON "drug_visibilities"("pharmacyId", "drugName");

-- CreateIndex
CREATE UNIQUE INDEX "central_admins_email_key" ON "central_admins"("email");

-- AddForeignKey
ALTER TABLE "drug_visibilities" ADD CONSTRAINT "drug_visibilities_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
