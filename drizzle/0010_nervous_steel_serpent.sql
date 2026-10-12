ALTER TABLE `users` ADD `blackCardImageUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `users` ADD `blackCardImageVisible` boolean DEFAULT true NOT NULL;
