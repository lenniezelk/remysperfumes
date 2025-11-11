ALTER TABLE `Role` ADD `key` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `Role_key_unique` ON `Role` (`key`);--> statement-breakpoint
ALTER TABLE `User` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `User` ADD `last_login_at` integer;