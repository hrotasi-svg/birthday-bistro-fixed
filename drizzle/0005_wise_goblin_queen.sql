CREATE TABLE `homepage_banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageUrl` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `homepage_banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visual_editor_elements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` varchar(64) NOT NULL DEFAULT 'home',
	`type` enum('text','image') NOT NULL,
	`content` text,
	`x` int NOT NULL DEFAULT 0,
	`y` int NOT NULL DEFAULT 0,
	`width` int NOT NULL DEFAULT 200,
	`height` int NOT NULL DEFAULT 50,
	`fontSize` int DEFAULT 16,
	`color` varchar(32) DEFAULT '#ffffff',
	`zIndex` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visual_editor_elements_id` PRIMARY KEY(`id`)
);
