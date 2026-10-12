CREATE TABLE `experience_surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`branchId` int NOT NULL DEFAULT 1,
	`expectation` varchar(32) NOT NULL,
	`attendAgain` varchar(32) NOT NULL,
	`recommend` varchar(32) NOT NULL,
	`attractions` text NOT NULL,
	`activityMvp` varchar(128),
	`atmosphereMvp` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experience_surveys_id` PRIMARY KEY(`id`),
	CONSTRAINT `experience_surveys_member_branch_unique` UNIQUE(`memberId`,`branchId`)
);
--> statement-breakpoint
CREATE INDEX `experience_surveys_branch_idx` ON `experience_surveys` (`branchId`);