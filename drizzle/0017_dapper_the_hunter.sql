CREATE INDEX `sale_customer_name_idx` ON `Sale` (`customer_name`);--> statement-breakpoint
CREATE INDEX `sale_customer_contact_idx` ON `Sale` (`customer_contact`);--> statement-breakpoint
CREATE INDEX `sale_date_idx` ON `Sale` (`date`);--> statement-breakpoint
CREATE INDEX `sale_total_amount_idx` ON `Sale` (`total_amount`);--> statement-breakpoint
CREATE INDEX `sale_deleted_at_idx` ON `Sale` (`deleted_at`);