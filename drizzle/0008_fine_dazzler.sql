CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city` varchar(64) NOT NULL,
	`district` varchar(64) NOT NULL,
	`username` varchar(64) NOT NULL,
	`password` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cashier_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int,
	`entryDate` varchar(16) NOT NULL,
	`kind` enum('income','expense') NOT NULL,
	`category` varchar(32) NOT NULL,
	`amount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cashier_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `city` varchar(64);--> statement-breakpoint
ALTER TABLE `bookings` ADD `district` varchar(64);