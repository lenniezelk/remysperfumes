
CREATE INDEX `product_name_idx` ON `Product` (`name`);--> statement-breakpoint
CREATE INDEX `product_category_id_idx` ON `Product` (`category_id`);--> statement-breakpoint
CREATE INDEX `product_brand_idx` ON `Product` (`brand`);--> statement-breakpoint
CREATE INDEX `product_created_at_idx` ON `Product` (`created_at`);--> statement-breakpoint
CREATE INDEX `product_deleted_at_idx` ON `Product` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `product_default_sell_price_idx` ON `Product` (`default_sell_price`);