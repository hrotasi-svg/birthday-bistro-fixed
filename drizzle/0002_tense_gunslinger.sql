ALTER TABLE `bookings` ADD `birthdayName` varchar(64);--> statement-breakpoint
ALTER TABLE `bookings` ADD `birthdayDate` varchar(16);--> statement-breakpoint
ALTER TABLE `bookings` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `bookings` ADD `lineId` varchar(64);--> statement-breakpoint
ALTER TABLE `bookings` ADD `job` varchar(128);--> statement-breakpoint
ALTER TABLE `bookings` ADD `skills` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `sessionType` enum('day','night');--> statement-breakpoint
ALTER TABLE `bookings` ADD `ceremonyType` enum('wish','chinese','korean');--> statement-breakpoint
ALTER TABLE `bookings` ADD `challengeLeader` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `bookings` ADD `partyThemeChoice` enum('store','custom');--> statement-breakpoint
ALTER TABLE `bookings` ADD `partyThemeCustom` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `sourceChannels` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `paymentPlan` varchar(32);