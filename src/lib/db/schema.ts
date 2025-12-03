import { int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categoryTable = sqliteTable("Category", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const manufacturerTable = sqliteTable("Manufacturer", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    contact_info: text("contact_info"),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    deleted_at: int("deleted_at", { mode: 'timestamp_ms' }),
});

export const productTable = sqliteTable("Product", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    category_id: text("category_id")
        .notNull()
        .references(() => categoryTable.id),
    brand: text("brand"),
    default_sell_price: int("default_sell_price").notNull(),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    manufacturer: text("manufacturer")
        .references(() => manufacturerTable.id),
    deleted_at: int("deleted_at", { mode: 'timestamp_ms' }),
});

export const productVariantTable = sqliteTable("ProductVariant", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: text("product_id")
        .notNull()
        .references(() => productTable.id),
    name: text("name").notNull(),
    sku: text("sku").notNull().unique(),
    default_sell_price: int("default_sell_price"),
    image: text("image"),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    deleted_at: int("deleted_at", { mode: 'timestamp_ms' }),
});

export const supplierTable = sqliteTable("Supplier", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    contact_info: text("contact_info"),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    deleted_at: int("deleted_at", { mode: 'timestamp_ms' }),
});

export const stockBatchTable = sqliteTable("StockBatch", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_variant_id: text("product_variant_id")
        .notNull()
        .references(() => productVariantTable.id),
    quantity_received: int("quantity_received").notNull(),
    quantity_remaining: int("quantity_remaining").notNull(),
    buy_price_per_unit: int("buy_price_per_unit").notNull(),
    sell_price_per_unit: int("sell_price_per_unit").notNull(),
    min_sale_price_per_unit: int("min_sale_price_per_unit").notNull(),
    received_at: int("received_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    supplier: text("supplier")
        .references(() => supplierTable.id),
    deleted_at: int("deleted_at", { mode: 'timestamp_ms' }),
});

export const saleTable = sqliteTable("Sale", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    date: int("date", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    total_amount: int("total_amount").notNull(),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    customer_name: text("customer_name"),
    customer_contact: text("customer_contact"),
});

export const saleItemTable = sqliteTable("SaleItem", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sale_id: text("sale_id")
        .notNull()
        .references(() => saleTable.id),
    product_variant_id: text("product_variant_id")
        .notNull()
        .references(() => productVariantTable.id),
    stock_batch_id: text("stock_batch_id")
        .notNull()
        .references(() => stockBatchTable.id),
    quantity_sold: int("quantity_sold").notNull(),
    price_at_sale: int("price_at_sale").notNull(),
    cost_at_sale: int("cost_at_sale").notNull(),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const roleTable = sqliteTable("Role", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    description: text("description"),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    key: text("key").notNull().unique(),
});

export const userTable = sqliteTable("User", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    role_id: text("role_id")
        .references(() => roleTable.id),
    is_active: integer("is_active", { mode: 'boolean' }).notNull().$defaultFn(() => false),
    created_at: int("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    updated_at: int("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
    password_hash: text("password_hash"),
    last_login_at: int("last_login_at", { mode: 'timestamp_ms' }),
    deleted_at: int("deleted_at", { mode: 'timestamp_ms' }),
});