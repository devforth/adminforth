-- CreateTable
CREATE TABLE `cars` (
    `id` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `engine_type` VARCHAR(191) NULL,
    `engine_power` INTEGER NULL,
    `production_year` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `listed` BOOLEAN NOT NULL DEFAULT false,
    `mileage` DOUBLE NULL,
    `color` VARCHAR(191) NULL,
    `body_type` VARCHAR(191) NULL,
    `photos` VARCHAR(191) NULL,
    `seller_id` VARCHAR(191) NULL,
    `seller` VARCHAR(191) NULL,
    `promo_picture` VARCHAR(191) NULL,
    `generated_promo_picture` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
