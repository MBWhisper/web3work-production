import { pgTable, text, integer, boolean, timestamp, real, pgEnum, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["freelancer", "employer", "admin"]);
export const jobStatusEnum = pgEnum("job_status", ["draft", "pending_payment", "active", "in_progress", "completed", "cancelled"]);
export const proposalStatusEnum = pgEnum("proposal_status", ["pending", "accepted", "rejected", "withdrawn"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["lemon_squeezy", "busd_bsc", "stripe"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "basic", "premium", "enterprise"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired", "trialing", "past_due"]);
export const escrowStatusEnum = pgEnum("escrow_status", ["funded", "released", "disputed", "refunded"]);

// ─── Users / Profiles ───────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("freelancer").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  location: text("location"),
  website: text("website"),
  twitter: text("twitter"),
  github: text("github"),
  skills: text("skills").array(),
  hourlyRate: real("hourly_rate"),
  walletAddress: text("wallet_address"),
  referralCode: text("referral_code").unique(),
  referredBy: uuid("referred_by"),
  totalEarnings: real("total_earnings").default(0),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Subscriptions ──────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").default("free").notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  lsSubscriptionId: text("ls_subscription_id"),
  lsCustomerId: text("ls_customer_id"),
  lsVariantId: text("ls_variant_id"),
  lsOrderId: text("ls_order_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  proposalsLeft: integer("proposals_left").default(3),
  jobPostsLeft: integer("job_posts_left").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Jobs ────────────────────────────────────────────────────────────────────
export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  employerId: uuid("employer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  budgetMin: real("budget_min"),
  budgetMax: real("budget_max"),
  budgetCurrency: text("budget_currency").default("USDT"),
  isFixed: boolean("is_fixed").default(true),
  experienceLevel: text("experience_level").default("mid"),
  deadline: timestamp("deadline"),
  status: jobStatusEnum("status").default("pending_payment").notNull(),
  paymentTxHash: text("payment_tx_hash"),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  proposalCount: integer("proposal_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Proposals ──────────────────────────────────────────────────────────────
export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  freelancerId: uuid("freelancer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  coverLetter: text("cover_letter").notNull(),
  bidAmount: real("bid_amount").notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  status: proposalStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Payments ────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").references(() => jobs.id),
  amount: real("amount").notNull(),
  currency: text("currency").default("USD").notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  lsOrderId: text("ls_order_id"),
  lsCheckoutId: text("ls_checkout_id"),
  txHash: text("tx_hash"),
  fromWallet: text("from_wallet"),
  toWallet: text("to_wallet"),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Escrow ──────────────────────────────────────────────────────────────────
export const escrows = pgTable("escrows", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  proposalId: uuid("proposal_id").notNull().references(() => proposals.id),
  employerId: uuid("employer_id").notNull().references(() => users.id),
  freelancerId: uuid("freelancer_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  currency: text("currency").default("BUSD"),
  status: escrowStatusEnum("status").default("funded").notNull(),
  contractAddress: text("contract_address"),
  fundTxHash: text("fund_tx_hash"),
  releaseTxHash: text("release_tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Messages ────────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id").notNull().references(() => users.id),
  receiverId: uuid("receiver_id").notNull().references(() => users.id),
  jobId: uuid("job_id").references(() => jobs.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => jobs.id),
  reviewerId: uuid("reviewer_id").notNull().references(() => users.id),
  revieweeId: uuid("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Referrals ───────────────────────────────────────────────────────────────
export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerId: uuid("referrer_id").notNull().references(() => users.id),
  referredId: uuid("referred_id").notNull().references(() => users.id),
  bonusAmount: real("bonus_amount").default(0),
  bonusPaid: boolean("bonus_paid").default(false),
  firstPaymentAt: timestamp("first_payment_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Notifications ───────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Insert Schemas ──────────────────────────────────────────────────────────
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, emailVerificationToken: true, passwordResetToken: true, passwordResetExpiry: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true, proposalCount: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// ─── Inferred Types ──────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Review = typeof reviews.$inferSelect;
export type Escrow = typeof escrows.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  role: z.enum(["freelancer", "employer"]).default("freelancer"),
  referralCode: z.string().optional(),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Subscription Plans Config ────────────────────────────────────────────────
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: 0,
    proposalsPerMonth: 3,
    jobPostsPerMonth: 0,
    features: ["Browse jobs", "3 proposals/month", "Basic profile"],
    lsVariantId: null,
  },
  basic: {
    name: "Basic",
    priceUSD: 19,
    priceBUSD: 19,
    proposalsPerMonth: 20,
    jobPostsPerMonth: 3,
    features: ["20 proposals/month", "3 job posts/month", "Featured listing (1)", "Priority support"],
    lsVariantId: process.env.LS_VARIANT_BASIC || "1412734",
  },
  premium: {
    name: "Premium",
    priceUSD: 49,
    priceBUSD: 49,
    proposalsPerMonth: -1,
    jobPostsPerMonth: 10,
    features: ["Unlimited proposals", "10 job posts/month", "Featured profile", "Advanced analytics", "Priority support"],
    lsVariantId: process.env.LS_VARIANT_PREMIUM || "1412692",
  },
  enterprise: {
    name: "Enterprise",
    priceUSD: 199,
    priceBUSD: 199,
    proposalsPerMonth: -1,
    jobPostsPerMonth: -1,
    features: ["Unlimited everything", "Dedicated account manager", "Custom branding", "API access", "SLA support"],
    lsVariantId: process.env.LS_VARIANT_ENTERPRISE || "1412728",
  },
} as const;

export const JOB_POST_PRICES = {
  standard: { usd: 9.99, busd: 9.99 },
  featured: { usd: 29.99, busd: 29.99 },
} as const;
