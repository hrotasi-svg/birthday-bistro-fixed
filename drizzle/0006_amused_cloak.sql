CREATE TABLE `ritual_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ritualType` enum('wish','korean','chinese') NOT NULL,
	`imageUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ritual_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `special_task_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`imageUrl` text NOT NULL,
	`visible` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `special_task_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_card_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`positionKey` varchar(64) NOT NULL,
	`imageUrl` text NOT NULL,
	`visible` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_card_images_id` PRIMARY KEY(`id`)
);
