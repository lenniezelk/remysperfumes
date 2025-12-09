PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Sale` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`total_amount` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`customer_name` text,
	`customer_contact` text,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_Sale`("id", "date", "total_amount", "created_at", "updated_at", "customer_name", "customer_contact", "deleted_at") SELECT "id", "date", "total_amount", "created_at", "updated_at", "customer_name", "customer_contact", "deleted_at" FROM `Sale`;--> statement-breakpoint
DROP TABLE `Sale`;--> statement-breakpoint
ALTER TABLE `__new_Sale` RENAME TO `Sale`;--> statement-breakpoint
PRAGMA foreign_keys=ON;