-- CreateTable
CREATE TABLE `adminuserCars` (
    `id` VARCHAR(191) NOT NULL,
    `adminuserId` VARCHAR(191) NOT NULL,
    `carId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
