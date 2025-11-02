CREATE TABLE `Category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Manufacturer` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact_info` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Product` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category_id` text NOT NULL,
	`brand` text,
	`default_sell_price` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`manufacturer` text,
	FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`manufacturer`) REFERENCES `Manufacturer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ProductVariant` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`default_sell_price` integer,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ProductVariant_sku_unique` ON `ProductVariant` (`sku`);--> statement-breakpoint
CREATE TABLE `Sale` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`total_amount` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`customer_name` text,
	`customer_contact` text
);
--> statement-breakpoint
CREATE TABLE `SaleItem` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_variant_id` text NOT NULL,
	`stock_batch_id` text NOT NULL,
	`quantity_sold` integer NOT NULL,
	`price_at_sale` integer NOT NULL,
	`cost_at_sale` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `Sale`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_variant_id`) REFERENCES `ProductVariant`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stock_batch_id`) REFERENCES `StockBatch`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `StockBatch` (
	`id` text PRIMARY KEY NOT NULL,
	`product_variant_id` text NOT NULL,
	`quantity_received` integer NOT NULL,
	`quantity_remaining` integer NOT NULL,
	`buy_price_per_unit` integer NOT NULL,
	`sell_price_per_unit` integer NOT NULL,
	`min_sale_price_per_unit` integer NOT NULL,
	`received_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`supplier` text,
	FOREIGN KEY (`product_variant_id`) REFERENCES `ProductVariant`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier`) REFERENCES `Supplier`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Supplier` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact_info` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
