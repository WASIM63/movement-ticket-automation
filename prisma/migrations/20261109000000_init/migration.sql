CREATE TABLE `Plant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `Plant_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `Vehicle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registration` VARCHAR(30) NOT NULL,
    `description` VARCHAR(120) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `Vehicle_registration_key` (`registration`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `Part` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productCode` VARCHAR(80) NOT NULL,
    `partName` VARCHAR(255) NOT NULL,
    `customerReference` VARCHAR(80) NULL,
    `salesOrder` VARCHAR(40) NULL,
    `subM` VARCHAR(50) NULL,
    `unit` VARCHAR(10) NOT NULL DEFAULT 'EA',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `Part_productCode_key` (`productCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `MovementTicket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketNumber` VARCHAR(40) NOT NULL,
    `ticketDate` DATETIME(3) NOT NULL,
    `plantId` INTEGER NULL,
    `vehicleId` INTEGER NULL,
    `vehicleNumber` VARCHAR(30) NOT NULL,
    `salesOrder` VARCHAR(40) NULL,
    `vendorType` VARCHAR(40) NULL,
    `transportMode` VARCHAR(40) NULL,
    `vehicleType` VARCHAR(40) NULL,
    `distanceKm` DECIMAL(10, 2) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    `sapDeliveryNumber` VARCHAR(40) NULL,
    `sapBillingNumber` VARCHAR(40) NULL,
    `sapMessage` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `MovementTicket_ticketNumber_key` (`ticketNumber`),
    INDEX `MovementTicket_ticketDate_idx` (`ticketDate`),
    INDEX `MovementTicket_status_idx` (`status`),
    CONSTRAINT `MovementTicket_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE
    SET NULL ON UPDATE CASCADE,
        CONSTRAINT `MovementTicket_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE
    SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `MovementTicketItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `partId` INTEGER NULL,
    `productCode` VARCHAR(80) NOT NULL,
    `partName` VARCHAR(255) NOT NULL,
    `customerReference` VARCHAR(80) NULL,
    `salesOrder` VARCHAR(40) NULL,
    `subM` VARCHAR(50) NULL,
    `quantity` DECIMAL(12, 3) NOT NULL,
    `unit` VARCHAR(10) NOT NULL DEFAULT 'EA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `MovementTicketItem_ticketId_idx` (`ticketId`),
    CONSTRAINT `MovementTicketItem_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `MovementTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `MovementTicketItem_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE
    SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entityType` VARCHAR(60) NOT NULL,
    `entityId` VARCHAR(60) NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `AuditLog_entityType_entityId_idx` (`entityType`, `entityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;