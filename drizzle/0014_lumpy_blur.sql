
CREATE INDEX `category_name_idx` ON `Category` (`name`);--> statement-breakpoint
CREATE INDEX `category_created_at_idx` ON `Category` (`created_at`);--> statement-breakpoint
CREATE INDEX `category_deleted_at_idx` ON `Category` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `category_description_idx` ON `Category` (`description`);