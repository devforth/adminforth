-- CreateTable
CREATE TABLE "adminuserCars" (
    "id" TEXT NOT NULL,
    "adminuserId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,

    CONSTRAINT "adminuserCars_pkey" PRIMARY KEY ("id")
);
