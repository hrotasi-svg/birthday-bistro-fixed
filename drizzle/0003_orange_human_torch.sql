CREATE TABLE `booking_revenue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`mealRevenue` varchar(32) DEFAULT '0',
	`drinkRevenue` varchar(32) DEFAULT '0',
	`totalRevenue` varchar(32) DEFAULT '0',
	`cashback` varchar(32) DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_revenue_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_revenue_bookingId_unique` UNIQUE(`bookingId`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(64) NOT NULL,
	`title` varchar(256),
	`description` text,
	`imageUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `short_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position` varchar(64) NOT NULL,
	`angle` varchar(32) NOT NULL,
	`videoUrl` text,
	`fileKey` varchar(512),
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `short_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `task_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleTitle` varchar(64) NOT NULL,
	`displayName` varchar(64),
	`taskDescription` text,
	`sortOrder` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `task_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `hidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `invite_codes` ADD `label` varchar(32) DEFAULT '';--> statement-breakpoint
ALTER TABLE `users` ADD `lineId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `memberNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `memberRole` enum('general','friend','host','premium') DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `premiumStatus` enum('none','subscribed','expired') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `premiumStartDate` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `premiumEndDate` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `blackCardMethod` enum('host','friend','subscription','none') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `blackCardDate` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `blackCardExpiry` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `blackCardNo` varchar(64);