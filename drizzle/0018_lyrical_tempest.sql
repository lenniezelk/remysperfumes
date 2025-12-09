CREATE INDEX `stock_batch_product_variant_id_idx` ON `StockBatch` (`product_variant_id`);--> statement-breakpoint
CREATE INDEX `stock_batch_supplier_idx` ON `StockBatch` (`supplier`);--> statement-breakpoint
CREATE INDEX `stock_batch_received_at_idx` ON `StockBatch` (`received_at`);--> statement-breakpoint
CREATE INDEX `stock_batch_created_at_idx` ON `StockBatch` (`created_at`);--> statement-breakpoint
CREATE INDEX `stock_batch_deleted_at_idx` ON `StockBatch` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `stock_batch_quantity_remaining_idx` ON `StockBatch` (`quantity_remaining`);