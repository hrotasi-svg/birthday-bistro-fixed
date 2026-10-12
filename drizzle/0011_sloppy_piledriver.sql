CREATE TABLE `booking_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`branchId` int NOT NULL DEFAULT 1,
	`recipient` enum('admin','customer') NOT NULL,
	`kind` enum('booking_submitted','booking_approved','payment_confirmed') NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_notifications_booking_kind_unique` UNIQUE(`bookingId`,`kind`)
);
