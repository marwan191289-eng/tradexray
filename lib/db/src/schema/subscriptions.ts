import { pgTable, text, timestamp, uuid, numeric, boolean, jsonb } from "drizzle-orm/pg-core";

export const subscriptionPlansTable = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  billingPeriod: text("billing_period").notNull(), // "monthly", "yearly"
  features: jsonb("features").notNull().default([]),
  maxSignals: numeric("max_signals", { precision: 10, scale: 0 }),
  maxUsers: numeric("max_users", { precision: 10, scale: 0 }),
  apiAccess: boolean("api_access").notNull().default(false),
  advancedAnalytics: boolean("advanced_analytics").notNull().default(false),
  prioritySupport: boolean("priority_support").notNull().default(false),
  customAlerts: boolean("custom_alerts").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSubscriptionsTable = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  planId: uuid("plan_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("active"), // "active", "canceled", "past_due", "paused"
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  autoRenew: boolean("auto_renew").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  subscriptionId: uuid("subscription_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // "pending", "completed", "failed", "refunded"
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paymentMethod: text("payment_method"), // "card", "bank_transfer", "wallet"
  description: text("description"),
  metadata: jsonb("metadata"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoicesTable = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  subscriptionId: uuid("subscription_id").notNull(),
  paymentId: uuid("payment_id"),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("draft"), // "draft", "sent", "paid", "overdue", "canceled"
  dueDate: timestamp("due_date", { withTimezone: true }),
  paidDate: timestamp("paid_date", { withTimezone: true }),
  items: jsonb("items").notNull().default([]),
  notes: text("notes"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const couponCodesTable = pgTable("coupon_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // "percentage", "fixed"
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: numeric("max_uses", { precision: 10, scale: 0 }),
  currentUses: numeric("current_uses", { precision: 10, scale: 0 }).notNull().default("0"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usageLimitsTable = pgTable("usage_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  signalsUsed: numeric("signals_used", { precision: 10, scale: 0 }).notNull().default("0"),
  apiCallsUsed: numeric("api_calls_used", { precision: 10, scale: 0 }).notNull().default("0"),
  storageUsedMb: numeric("storage_used_mb", { precision: 10, scale: 2 }).notNull().default("0"),
  resetDate: timestamp("reset_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Types
export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlansTable.$inferInsert;

export type UserSubscription = typeof userSubscriptionsTable.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptionsTable.$inferInsert;

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;

export type Invoice = typeof invoicesTable.$inferSelect;
export type InsertInvoice = typeof invoicesTable.$inferInsert;

export type CouponCode = typeof couponCodesTable.$inferSelect;
export type InsertCouponCode = typeof couponCodesTable.$inferInsert;

export type UsageLimit = typeof usageLimitsTable.$inferSelect;
export type InsertUsageLimit = typeof usageLimitsTable.$inferInsert;
