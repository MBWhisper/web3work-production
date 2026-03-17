import { createClient } from "@supabase/supabase-js";
import type {
  User, InsertUser, Profile, InsertProfile,
  Job, InsertJob, Proposal, InsertProposal,
  Payment, InsertPayment, Subscription, InsertSubscription,
  Message, InsertMessage, Review, Escrow, Referral, Notification,
} from "@shared/schema";

// ─── Supabase client (lazy — only created when env vars are present) ────────────
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}
const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  }
});

// ─── Storage Interface ────────────────────────────────────────────────────────
export interface IStorage {
  // Auth
  createUser(data: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  verifyEmail(token: string): Promise<User | null>;

  // Profile
  getProfileByUserId(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, data: Partial<Profile>): Promise<Profile>;
  getProfileByReferralCode(code: string): Promise<Profile | null>;

  // Jobs
  createJob(data: InsertJob): Promise<Job>;
  getJobById(id: string): Promise<Job | null>;
  getJobs(filters?: { category?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<{ jobs: Job[]; total: number }>;
  updateJob(id: string, data: Partial<Job>): Promise<Job>;
  getJobsByEmployer(employerId: string): Promise<Job[]>;

  // Proposals
  createProposal(data: InsertProposal): Promise<Proposal>;
  getProposalsByJob(jobId: string): Promise<Proposal[]>;
  getProposalsByFreelancer(freelancerId: string): Promise<Proposal[]>;
  updateProposal(id: string, data: Partial<Proposal>): Promise<Proposal>;
  getProposalById(id: string): Promise<Proposal | null>;

  // Payments
  createPayment(data: InsertPayment): Promise<Payment>;
  getPaymentById(id: string): Promise<Payment | null>;
  getPaymentByLsOrder(lsOrderId: string): Promise<Payment | null>;
  updatePayment(id: string, data: Partial<Payment>): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;

  // Subscriptions
  getSubscriptionByUser(userId: string): Promise<Subscription | null>;
  upsertSubscription(userId: string, data: Partial<Subscription>): Promise<Subscription>;
  getSubscriptionByLsId(lsSubscriptionId: string): Promise<Subscription | null>;

  // Messages
  createMessage(data: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1: string, user2: string): Promise<Message[]>;
  markMessagesRead(receiverId: string, senderId: string): Promise<void>;

  // Reviews
  createReview(data: Omit<Review, "id" | "created_at">): Promise<Review>;
  getReviewsByUser(userId: string): Promise<Review[]>;

  // Escrow
  createEscrow(data: Omit<Escrow, "id" | "created_at" | "updated_at">): Promise<Escrow>;
  getEscrowByJob(jobId: string): Promise<Escrow | null>;
  updateEscrow(id: string, data: Partial<Escrow>): Promise<Escrow>;

  // Referrals
  createReferral(referrerId: string, referredId: string): Promise<Referral>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  updateReferral(id: string, data: Partial<Referral>): Promise<Referral>;

  // Notifications
  createNotification(data: Omit<Notification, "id" | "created_at">): Promise<Notification>;
  getNotificationsByUser(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Admin
  getPlatformStats(): Promise<Record<string, number>>;
  getRevenueByMonth(): Promise<{ month: string; revenue: number }[]>;
  getAllUsers(page: number, limit: number): Promise<{ users: User[]; total: number }>;
}

// ─── Supabase Implementation ──────────────────────────────────────────────────
export class SupabaseStorage implements IStorage {
  // AUTH
  async createUser(data: InsertUser): Promise<User> {
    const { data: user, error } = await supabase.from("users").insert(data).select().single();
    if (error) throw new Error(error.message);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data } = await supabase.from("users").select().eq("id", id).single();
    return data ?? null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data } = await supabase.from("users").select().eq("email", email.toLowerCase()).single();
    return data ?? null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const { data: user, error } = await supabase.from("users").update(data).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return user;
  }

  async verifyEmail(token: string): Promise<User | null> {
    const { data } = await supabase.from("users")
      .update({ email_verified: true, email_verification_token: null })
      .eq("email_verification_token", token)
      .select().single();
    return data ?? null;
  }

  // PROFILE
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from("profiles").select().eq("user_id", userId).single();
    return data ?? null;
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    const { data: profile, error } = await supabase.from("profiles").update(data).eq("user_id", userId).select().single();
    if (error) throw new Error(error.message);
    return profile;
  }

  async getProfileByReferralCode(code: string): Promise<Profile | null> {
    const { data } = await supabase.from("profiles").select().eq("referral_code", code).single();
    return data ?? null;
  }

  // JOBS
  async createJob(data: InsertJob): Promise<Job> {
    const { data: job, error } = await supabase.from("jobs").insert(data).select().single();
    if (error) throw new Error(error.message);
    return job;
  }

  async getJobById(id: string): Promise<Job | null> {
    const { data } = await supabase.from("jobs").select().eq("id", id).single();
    if (data) {
      await supabase.from("jobs").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", id);
    }
    return data ?? null;
  }

  async getJobs(filters?: { category?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const from = (page - 1) * limit;

    let query = supabase.from("jobs").select("*", { count: "exact" });

    if (filters?.status) query = query.eq("status", filters.status);
    else query = query.eq("status", "active");

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

    query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false }).range(from, from + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);
    return { jobs: data ?? [], total: count ?? 0 };
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    const { data: job, error } = await supabase.from("jobs").update(data).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return job;
  }

  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    const { data } = await supabase.from("jobs").select().eq("employer_id", employerId).order("created_at", { ascending: false });
    return data ?? [];
  }

  // PROPOSALS
  async createProposal(data: InsertProposal): Promise<Proposal> {
    const { data: proposal, error } = await supabase.from("proposals").insert(data).select().single();
    if (error) throw new Error(error.message);
    return proposal;
  }

  async getProposalsByJob(jobId: string): Promise<Proposal[]> {
    const { data } = await supabase.from("proposals").select().eq("job_id", jobId).order("created_at", { ascending: false });
    return data ?? [];
  }

  async getProposalsByFreelancer(freelancerId: string): Promise<Proposal[]> {
    const { data } = await supabase.from("proposals").select("*, jobs(*)").eq("freelancer_id", freelancerId).order("created_at", { ascending: false });
    return data ?? [];
  }

  async updateProposal(id: string, data: Partial<Proposal>): Promise<Proposal> {
    const { data: proposal, error } = await supabase.from("proposals").update(data).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return proposal;
  }

  async getProposalById(id: string): Promise<Proposal | null> {
    const { data } = await supabase.from("proposals").select().eq("id", id).single();
    return data ?? null;
  }

  // PAYMENTS
  async createPayment(data: InsertPayment): Promise<Payment> {
    const { data: payment, error } = await supabase.from("payments").insert(data).select().single();
    if (error) throw new Error(error.message);
    return payment;
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const { data } = await supabase.from("payments").select().eq("id", id).single();
    return data ?? null;
  }

  async getPaymentByLsOrder(lsOrderId: string): Promise<Payment | null> {
    const { data } = await supabase.from("payments").select().eq("ls_order_id", lsOrderId).single();
    return data ?? null;
  }

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    const { data: payment, error } = await supabase.from("payments").update(data).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return payment;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const { data } = await supabase.from("payments").select().eq("user_id", userId).order("created_at", { ascending: false });
    return data ?? [];
  }

  // SUBSCRIPTIONS
  async getSubscriptionByUser(userId: string): Promise<Subscription | null> {
    const { data } = await supabase.from("subscriptions").select().eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single();
    return data ?? null;
  }

  async upsertSubscription(userId: string, data: Partial<Subscription>): Promise<Subscription> {
    const existing = await this.getSubscriptionByUser(userId);
    if (existing) {
      const { data: sub, error } = await supabase.from("subscriptions").update(data).eq("id", existing.id).select().single();
      if (error) throw new Error(error.message);
      return sub;
    } else {
      const { data: sub, error } = await supabase.from("subscriptions").insert({ user_id: userId, ...data }).select().single();
      if (error) throw new Error(error.message);
      return sub;
    }
  }

  async getSubscriptionByLsId(lsSubscriptionId: string): Promise<Subscription | null> {
    const { data } = await supabase.from("subscriptions").select().eq("ls_subscription_id", lsSubscriptionId).single();
    return data ?? null;
  }

  // MESSAGES
  async createMessage(data: InsertMessage): Promise<Message> {
    const { data: msg, error } = await supabase.from("messages").insert(data).select().single();
    if (error) throw new Error(error.message);
    return msg;
  }

  async getMessagesBetweenUsers(user1: string, user2: string): Promise<Message[]> {
    const { data } = await supabase.from("messages")
      .select()
      .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
      .order("created_at", { ascending: true });
    return data ?? [];
  }

  async markMessagesRead(receiverId: string, senderId: string): Promise<void> {
    await supabase.from("messages").update({ is_read: true })
      .eq("receiver_id", receiverId).eq("sender_id", senderId).eq("is_read", false);
  }

  // REVIEWS
  async createReview(data: Omit<Review, "id" | "created_at">): Promise<Review> {
    const { data: review, error } = await supabase.from("reviews").insert(data).select().single();
    if (error) throw new Error(error.message);
    return review;
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    const { data } = await supabase.from("reviews").select("*, reviewer:profiles!reviewer_id(display_name, avatar_url)").eq("reviewee_id", userId).order("created_at", { ascending: false });
    return data ?? [];
  }

  // ESCROW
  async createEscrow(data: Omit<Escrow, "id" | "created_at" | "updated_at">): Promise<Escrow> {
    const { data: escrow, error } = await supabase.from("escrows").insert(data).select().single();
    if (error) throw new Error(error.message);
    return escrow;
  }

  async getEscrowByJob(jobId: string): Promise<Escrow | null> {
    const { data } = await supabase.from("escrows").select().eq("job_id", jobId).single();
    return data ?? null;
  }

  async updateEscrow(id: string, data: Partial<Escrow>): Promise<Escrow> {
    const { data: escrow, error } = await supabase.from("escrows").update(data).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return escrow;
  }

  // REFERRALS
  async createReferral(referrerId: string, referredId: string): Promise<Referral> {
    const { data, error } = await supabase.from("referrals").insert({ referrer_id: referrerId, referred_id: referredId }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    const { data } = await supabase.from("referrals").select("*, referred:profiles!referred_id(display_name, avatar_url)").eq("referrer_id", referrerId).order("created_at", { ascending: false });
    return data ?? [];
  }

  async updateReferral(id: string, data: Partial<Referral>): Promise<Referral> {
    const { data: ref, error } = await supabase.from("referrals").update(data).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return ref;
  }

  // NOTIFICATIONS
  async createNotification(data: Omit<Notification, "id" | "created_at">): Promise<Notification> {
    const { data: notif, error } = await supabase.from("notifications").insert(data).select().single();
    if (error) throw new Error(error.message);
    return notif;
  }

  async getNotificationsByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = supabase.from("notifications").select().eq("user_id", userId);
    if (unreadOnly) query = query.eq("is_read", false);
    const { data } = await query.order("created_at", { ascending: false }).limit(50);
    return data ?? [];
  }

  async markNotificationRead(id: string): Promise<void> {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
  }

  // ADMIN
  async getPlatformStats(): Promise<Record<string, number>> {
    const { data } = await supabase.from("platform_stats").select().single();
    return data ?? {};
  }

  async getRevenueByMonth(): Promise<{ month: string; revenue: number }[]> {
    const { data } = await supabase.rpc("get_revenue_by_month");
    return data ?? [];
  }

  async getAllUsers(page = 1, limit = 20): Promise<{ users: User[]; total: number }> {
    const from = (page - 1) * limit;
    const { data, count } = await supabase.from("users").select("*, profiles(*)", { count: "exact" }).range(from, from + limit - 1).order("created_at", { ascending: false });
    return { users: data ?? [], total: count ?? 0 };
  }
}

// ─── In-Memory Fallback (for dev without Supabase) ───────────────────────────
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private profiles = new Map<string, Profile>();
  private subscriptions = new Map<string, Subscription>();
  private jobs = new Map<string, Job>();
  private proposals = new Map<string, Proposal>();
  private payments = new Map<string, Payment>();
  private messages: Message[] = [];
  private reviews: Review[] = [];
  private escrows = new Map<string, Escrow>();
  private referrals: Referral[] = [];
  private notifications: Notification[] = [];
  private uid = () => crypto.randomUUID();

  async createUser(data: InsertUser): Promise<User> {
    const user: User = { ...data, id: this.uid(), email_verified: false, is_active: true, created_at: new Date(), updated_at: new Date(), email_verification_token: null, password_reset_token: null, password_reset_expiry: null };
    this.users.set(user.id, user);
    const profile: Profile = { id: this.uid(), user_id: user.id, display_name: user.email.split("@")[0], bio: null, avatar_url: null, location: null, website: null, twitter: null, github: null, skills: [], hourly_rate: null, wallet_address: null, referral_code: Math.random().toString(36).slice(2, 8), referred_by: null, total_earnings: 0, rating: 0, review_count: 0, is_featured: false, created_at: new Date(), updated_at: new Date() };
    this.profiles.set(user.id, profile);
    const sub: Subscription = { id: this.uid(), user_id: user.id, tier: "free", status: "active", ls_subscription_id: null, ls_customer_id: null, ls_variant_id: null, ls_order_id: null, current_period_start: null, current_period_end: null, cancel_at_period_end: false, proposals_left: 3, job_posts_left: 0, created_at: new Date(), updated_at: new Date() };
    this.subscriptions.set(user.id, sub);
    return user;
  }
  async getUserById(id: string): Promise<User | null> { return this.users.get(id) ?? null; }
  async getUserByEmail(email: string): Promise<User | null> { return [...this.users.values()].find(u => u.email === email.toLowerCase()) ?? null; }
  async updateUser(id: string, data: Partial<User>): Promise<User> { const u = { ...this.users.get(id)!, ...data }; this.users.set(id, u); return u; }
  async verifyEmail(token: string): Promise<User | null> { const u = [...this.users.values()].find(u => u.email_verification_token === token); if (!u) return null; return this.updateUser(u.id, { email_verified: true, email_verification_token: null }); }
  async getProfileByUserId(userId: string): Promise<Profile | null> { return this.profiles.get(userId) ?? null; }
  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> { const p = { ...this.profiles.get(userId)!, ...data }; this.profiles.set(userId, p); return p; }
  async getProfileByReferralCode(code: string): Promise<Profile | null> { return [...this.profiles.values()].find(p => p.referral_code === code) ?? null; }
  async createJob(data: InsertJob): Promise<Job> { const j: Job = { ...data, id: this.uid(), view_count: 0, proposal_count: 0, created_at: new Date(), updated_at: new Date() } as Job; this.jobs.set(j.id, j); return j; }
  async getJobById(id: string): Promise<Job | null> { const j = this.jobs.get(id); if (j) this.jobs.set(id, { ...j, view_count: (j.view_count ?? 0) + 1 }); return this.jobs.get(id) ?? null; }
  async getJobs(f?: any) { let jobs = [...this.jobs.values()].filter(j => !f?.status ? j.status === "active" : j.status === f.status); if (f?.category) jobs = jobs.filter(j => j.category === f.category); if (f?.search) jobs = jobs.filter(j => j.title.toLowerCase().includes(f.search.toLowerCase())); const page = f?.page ?? 1; const limit = f?.limit ?? 20; return { jobs: jobs.slice((page-1)*limit, page*limit), total: jobs.length }; }
  async updateJob(id: string, data: Partial<Job>): Promise<Job> { const j = { ...this.jobs.get(id)!, ...data }; this.jobs.set(id, j); return j; }
  async getJobsByEmployer(employerId: string): Promise<Job[]> { return [...this.jobs.values()].filter(j => j.employer_id === employerId); }
  async createProposal(data: InsertProposal): Promise<Proposal> { const p: Proposal = { ...data, id: this.uid(), created_at: new Date(), updated_at: new Date() } as Proposal; this.proposals.set(p.id, p); return p; }
  async getProposalsByJob(jobId: string): Promise<Proposal[]> { return [...this.proposals.values()].filter(p => p.job_id === jobId); }
  async getProposalsByFreelancer(freelancerId: string): Promise<Proposal[]> { return [...this.proposals.values()].filter(p => p.freelancer_id === freelancerId); }
  async updateProposal(id: string, data: Partial<Proposal>): Promise<Proposal> { const p = { ...this.proposals.get(id)!, ...data }; this.proposals.set(id, p); return p; }
  async getProposalById(id: string): Promise<Proposal | null> { return this.proposals.get(id) ?? null; }
  async createPayment(data: InsertPayment): Promise<Payment> { const p: Payment = { ...data, id: this.uid(), created_at: new Date(), updated_at: new Date() } as Payment; this.payments.set(p.id, p); return p; }
  async getPaymentById(id: string): Promise<Payment | null> { return this.payments.get(id) ?? null; }
  async getPaymentByLsOrder(lsOrderId: string): Promise<Payment | null> { return [...this.payments.values()].find(p => p.ls_order_id === lsOrderId) ?? null; }
  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> { const p = { ...this.payments.get(id)!, ...data }; this.payments.set(id, p); return p; }
  async getPaymentsByUser(userId: string): Promise<Payment[]> { return [...this.payments.values()].filter(p => p.user_id === userId); }
  async getSubscriptionByUser(userId: string): Promise<Subscription | null> { return this.subscriptions.get(userId) ?? null; }
  async upsertSubscription(userId: string, data: Partial<Subscription>): Promise<Subscription> { const existing = this.subscriptions.get(userId) ?? { id: this.uid(), user_id: userId, tier: "free", status: "active", proposals_left: 3, job_posts_left: 0, created_at: new Date(), updated_at: new Date() } as Subscription; const updated = { ...existing, ...data }; this.subscriptions.set(userId, updated); return updated; }
  async getSubscriptionByLsId(lsSubscriptionId: string): Promise<Subscription | null> { return [...this.subscriptions.values()].find(s => s.ls_subscription_id === lsSubscriptionId) ?? null; }
  async createMessage(data: InsertMessage): Promise<Message> { const m: Message = { ...data, id: this.uid(), created_at: new Date() } as Message; this.messages.push(m); return m; }
  async getMessagesBetweenUsers(u1: string, u2: string): Promise<Message[]> { return this.messages.filter(m => (m.sender_id === u1 && m.receiver_id === u2) || (m.sender_id === u2 && m.receiver_id === u1)); }
  async markMessagesRead(receiverId: string, senderId: string): Promise<void> { this.messages.forEach(m => { if (m.receiver_id === receiverId && m.sender_id === senderId) m.is_read = true; }); }
  async createReview(data: Omit<Review, "id" | "created_at">): Promise<Review> { const r: Review = { ...data, id: this.uid(), created_at: new Date() }; this.reviews.push(r); return r; }
  async getReviewsByUser(userId: string): Promise<Review[]> { return this.reviews.filter(r => r.reviewee_id === userId); }
  async createEscrow(data: Omit<Escrow, "id" | "created_at" | "updated_at">): Promise<Escrow> { const e: Escrow = { ...data, id: this.uid(), created_at: new Date(), updated_at: new Date() }; this.escrows.set(e.id, e); return e; }
  async getEscrowByJob(jobId: string): Promise<Escrow | null> { return [...this.escrows.values()].find(e => e.job_id === jobId) ?? null; }
  async updateEscrow(id: string, data: Partial<Escrow>): Promise<Escrow> { const e = { ...this.escrows.get(id)!, ...data }; this.escrows.set(id, e); return e; }
  async createReferral(referrerId: string, referredId: string): Promise<Referral> { const r: Referral = { id: this.uid(), referrer_id: referrerId, referred_id: referredId, bonus_amount: 0, bonus_paid: false, first_payment_at: null, created_at: new Date() }; this.referrals.push(r); return r; }
  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> { return this.referrals.filter(r => r.referrer_id === referrerId); }
  async updateReferral(id: string, data: Partial<Referral>): Promise<Referral> { const i = this.referrals.findIndex(r => r.id === id); if (i >= 0) this.referrals[i] = { ...this.referrals[i], ...data }; return this.referrals[i]; }
  async createNotification(data: Omit<Notification, "id" | "created_at">): Promise<Notification> { const n: Notification = { ...data, id: this.uid(), created_at: new Date() }; this.notifications.push(n); return n; }
  async getNotificationsByUser(userId: string, unreadOnly = false): Promise<Notification[]> { return this.notifications.filter(n => n.user_id === userId && (!unreadOnly || !n.is_read)).slice(0, 50); }
  async markNotificationRead(id: string): Promise<void> { const n = this.notifications.find(n => n.id === id); if (n) n.is_read = true; }
  async markAllNotificationsRead(userId: string): Promise<void> { this.notifications.filter(n => n.user_id === userId).forEach(n => n.is_read = true); }
  async getPlatformStats(): Promise<Record<string, number>> {
    return {
      total_users: this.users.size,
      active_jobs: [...this.jobs.values()].filter(j => j.status === "active").length,
      completed_jobs: [...this.jobs.values()].filter(j => j.status === "completed").length,
      total_revenue: [...this.payments.values()].filter(p => p.status === "completed").reduce((s, p) => s + (p.amount ?? 0), 0),
      paid_subscribers: [...this.subscriptions.values()].filter(s => s.status === "active" && s.tier !== "free").length,
      total_proposals: this.proposals.size,
    };
  }
  async getRevenueByMonth(): Promise<{ month: string; revenue: number }[]> { return []; }
  async getAllUsers(page = 1, limit = 20) { const all = [...this.users.values()]; return { users: all.slice((page-1)*limit, page*limit), total: all.length }; }
}

export const storage: IStorage = process.env.SUPABASE_URL
  ? new SupabaseStorage()
  : new MemStorage();
