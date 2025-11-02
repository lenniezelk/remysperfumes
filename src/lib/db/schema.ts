import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const category = sqliteTable("Category", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const manufacturer = sqliteTable("Manufacturer", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    contact_info: text("contact_info"),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const product = sqliteTable("Product", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    category_id: text("category_id")
        .notNull()
        .references(() => category.id),
    brand: text("brand"),
    default_sell_price: int("default_sell_price").notNull(),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    manufacturer: text("manufacturer")
        .references(() => manufacturer.id),
});

export const productVariant = sqliteTable("ProductVariant", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: text("product_id")
        .notNull()
        .references(() => product.id),
    name: text("name").notNull(),
    sku: text("sku").notNull().unique(),
    default_sell_price: int("default_sell_price"),
    image: text("image"),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const supplier = sqliteTable("Supplier", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    contact_info: text("contact_info"),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const stockBatch = sqliteTable("StockBatch", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_variant_id: text("product_variant_id")
        .notNull()
        .references(() => productVariant.id),
    quantity_received: int("quantity_received").notNull(),
    quantity_remaining: int("quantity_remaining").notNull(),
    buy_price_per_unit: int("buy_price_per_unit").notNull(),
    sell_price_per_unit: int("sell_price_per_unit").notNull(),
    min_sale_price_per_unit: int("min_sale_price_per_unit").notNull(),
    received_at: int("received_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    supplier: text("supplier")
        .references(() => supplier.id),
});

export const sale = sqliteTable("Sale", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    date: int("date", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    total_amount: int("total_amount").notNull(),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    customer_name: text("customer_name"),
    customer_contact: text("customer_contact"),
});

export const saleItem = sqliteTable("SaleItem", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sale_id: text("sale_id")
        .notNull()
        .references(() => sale.id),
    product_variant_id: text("product_variant_id")
        .notNull()
        .references(() => productVariant.id),
    stock_batch_id: text("stock_batch_id")
        .notNull()
        .references(() => stockBatch.id),
    quantity_sold: int("quantity_sold").notNull(),
    price_at_sale: int("price_at_sale").notNull(),
    cost_at_sale: int("cost_at_sale").notNull(),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});