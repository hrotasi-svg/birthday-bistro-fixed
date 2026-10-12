CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventDate` varchar(16) NOT NULL,
	`timeSlot` varchar(32),
	`guestCount` int DEFAULT 1,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`challengeMode` boolean DEFAULT false,
	`themeType` varchar(64),
	`themeCustom` text,
	`specialRequests` text,
	`sourceChannel` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_guests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`inviteCode` varchar(32),
	`roleTitle` varchar(64),
	`status` enum('active','removed','replaced') NOT NULL DEFAULT 'active',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_guests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int,
	`hostUserId` int NOT NULL,
	`title` varchar(256),
	`status` enum('pending_review','approved','deposit_paid','locked','full_paid','active','completed','cancelled') NOT NULL DEFAULT 'pending_review',
	`eventDate` varchar(16),
	`eventType` enum('weekday','student','holiday') DEFAULT 'weekday',
	`totalRevenue` decimal(12,2) DEFAULT '0',
	`cost` decimal(12,2) DEFAULT '0',
	`profit` decimal(12,2) DEFAULT '0',
	`hostShare` decimal(12,2) DEFAULT '0',
	`platformShare` decimal(12,2) DEFAULT '0',
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`revenue` decimal(12,2) DEFAULT '0',
	`cost` decimal(12,2) DEFAULT '0',
	`profit` decimal(12,2) DEFAULT '0',
	`hostShare` decimal(12,2) DEFAULT '0',
	`platformShare` decimal(12,2) DEFAULT '0',
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finance_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `finance_records_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `invite_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`eventId` int NOT NULL,
	`type` enum('host','guest') NOT NULL DEFAULT 'guest',
	`usedByUserId` int,
	`used` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invite_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `invite_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`type` enum('deposit','full') NOT NULL,
	`status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`method` varchar(64),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`assignedUserId` int,
	`roleTitle` varchar(64) NOT NULL,
	`taskDescription` text,
	`status` enum('pending','done') NOT NULL DEFAULT 'pending',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('selfie','close','medium','wide','behind','fun') DEFAULT 'selfie',
	`url` text NOT NULL,
	`fileKey` varchar(512),
	`duration` int,
	`aiTag` varchar(256),
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `birthday` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female','other');--> statement-breakpoint
ALTER TABLE `users` ADD `job` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `skills` text;