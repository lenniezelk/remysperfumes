CREATE INDEX `name_idx` ON `User` (`name`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `User` (`email`);--> statement-breakpoint
CREATE INDEX `role_id_idx` ON `User` (`role_id`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `User` (`is_active`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `User` (`created_at`);--> statement-breakpoint
CREATE INDEX `deleted_at_idx` ON `User` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `last_login_at_idx` ON `User` (`last_login_at`);--> statement-breakpoint
CREATE INDEX `active_not_deleted_idx` ON `User` (`is_active`,`deleted_at`);