CREATE TABLE `monthly_king_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`month` int NOT NULL,
	`name` varchar(64) NOT NULL DEFAULT '',
	`eventDate` varchar(32) DEFAULT '',
	`revenue` varchar(32) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_king_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `monthly_king_entries_month_unique` UNIQUE(`month`)
);
--> statement-breakpoint
CREATE TABLE `npc_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('influencer','kol','anchor','artist','band','singer') NOT NULL,
	`label` varchar(64) NOT NULL,
	`description` text,
	`imageUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `npc_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `short_videos` ADD `eventId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlatform` varchar(32) DEFAULT 'restaurant';--> statement-breakpoint
ALTER TABLE `users` ADD `blackCardBenefit` varchar(128) DEFAULT '全年用餐五折優惠';--> statement-breakpoint
ALTER TABLE `users` ADD `blackCardAcquiredBy` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `appAutoRenew` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `appCancelStatus` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `appPromo` text;