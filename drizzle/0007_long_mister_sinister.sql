CREATE TABLE `entity_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(32) NOT NULL,
	`entityKey` varchar(64) NOT NULL,
	`imageUrl` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entity_images_id` PRIMARY KEY(`id`)
);
