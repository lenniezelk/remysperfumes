CREATE TABLE `SaleItemBatch` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_item_id` text NOT NULL,
	`stock_batch_id` text NOT NULL,
	`quantity_from_batch` integer NOT NULL,
	`cost_from_batch` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`sale_item_id`) REFERENCES `SaleItem`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stock_batch_id`) REFERENCES `StockBatch`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_SaleItem` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_variant_id` text NOT NULL,
	`quantity_sold` integer NOT NULL,
	`price_at_sale` integer NOT NULL,
	`cost_at_sale` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`sale_id`) REFERENCES `Sale`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_variant_id`) REFERENCES `ProductVariant`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_SaleItem`("id", "sale_id", "product_variant_id", "quantity_sold", "price_at_sale", "cost_at_sale", "created_at", "updated_at", "deleted_at") SELECT "id", "sale_id", "product_variant_id", "quantity_sold", "price_at_sale", "cost_at_sale", "created_at", "updated_at", "deleted_at" FROM `SaleItem`;--> statement-breakpoint
DROP TABLE `SaleItem`;--> statement-breakpoint
ALTER TABLE `__new_SaleItem` RENAME TO `SaleItem`;--> statement-breakpoint
PRAGMA foreign_keys=ON;