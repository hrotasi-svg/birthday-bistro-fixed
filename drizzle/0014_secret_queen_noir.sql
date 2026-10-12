CREATE TABLE `booking_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL DEFAULT 1,
	`bookingId` int NOT NULL,
	`payerKey` varchar(64) NOT NULL,
	`payerLabel` varchar(64) NOT NULL,
	`method` enum('line_pay','jkopay','twqr','cash') NOT NULL,
	`status` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`amount` int NOT NULL DEFAULT 0,
	`paidAt` timestamp,
	`refundedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_payments_booking_payer_unique` UNIQUE(`bookingId`,`payerKey`)
);
--> statement-breakpoint
CREATE TABLE `payment_channel_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL DEFAULT 1,
	`channel` enum('line_pay','jkopay','twqr') NOT NULL,
	`visible` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_channel_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_channel_settings_branch_channel_unique` UNIQUE(`branchId`,`channel`)
);
--> statement-breakpoint
CREATE INDEX `booking_payments_branch_method_idx` ON `booking_payments` (`branchId`,`method`);