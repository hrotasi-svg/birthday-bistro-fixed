CREATE TABLE `page_text_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL DEFAULT 1,
	`pageId` varchar(32) NOT NULL,
	`selector` text NOT NULL,
	`originalText` text NOT NULL,
	`newText` text,
	`fontScale` int NOT NULL DEFAULT 100,
	`color` varchar(32),
	`hidden` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_text_overrides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `monthly_king_entries` DROP INDEX `monthly_king_entries_month_unique`;--> statement-breakpoint
ALTER TABLE `bookings` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `entity_images` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `entity_images` ADD `visible` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `homepage_banners` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `monthly_king_entries` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `npc_items` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `ritual_images` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `short_videos` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `special_task_cards` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `task_card_images` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `task_positions` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `videos` ADD `branchId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `visual_editor_elements` ADD `branchId` int DEFAULT 1 NOT NULL;