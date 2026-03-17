import { lemonSqueezySetup, createCheckout, getSubscription, cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { ethers } from "ethers";
import { storage } from "./storage";
import { SUBSCRIPTION_PLANS, JOB_POST_PRICES } from "@shared/schema";

// ─── Lemon Squeezy Setup ─────────────────────────────────────────────────────
export function initLemonSqueezy() {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });
}

export async function createLSCheckout(opts: {
  userId: string;
  email: string;
  variantId: string;
  redirectUrl: string;
  metadata?: Record<string, string>;
}) {
  const storeId = process.env.LS_STORE_ID!;
  const result = await createCheckout(storeId, opts.variantId, {
    checkoutData: {
      email: opts.email,
      custom: { user_id: opts.userId, ...opts.metadata },
    },
    checkoutOptions: {
      embed: false,
      media: true,
      logo: true,
      buttonColor: "#F0B90B",
    },
    productOptions: {
      redirectUrl: opts.redirectUrl,
      receiptButtonText: "Go to Dashboard",
      receiptThankYouNote: "Thank you for choosing Web3Work!",
    },
  });

  if (result.error) throw new Error(result.error.message);
  return result.data?.data;
}

export async function cancelLSSubscription(lsSubscriptionId: string) {
  const result = await cancelSubscription(lsSubscriptionId);
  if (result.error) throw new Error(result.error.message);
  return result.data?.data;
}

// ─── Lemon Squeezy Webhook Processor ─────────────────────────────────────────
export async function processLSWebhook(event: string, payload: any) {
  const meta = payload.meta?.custom_data ?? {};
  const userId = meta.user_id;
  const attrs = payload.data?.attributes ?? {};

  switch (event) {
    case "order_created": {
      // One-time payment (job post)
      if (userId && meta.job_id) {
        const payment = await storage.createPayment({
          user_id: userId,
          job_id: meta.job_id,
          amount: attrs.total / 100,
          currency: attrs.currency ?? "USD",
          method: "lemon_squeezy",
          status: "pending",
          ls_order_id: String(payload.data.id),
          description: `Job post payment: ${meta.job_title ?? ""}`,
        });
        return payment;
      }
      break;
    }

    case "order_refunded": {
      const payment = await storage.getPaymentByLsOrder(String(payload.data.id));
      if (payment) {
        await storage.updatePayment(payment.id, { status: "refunded" });
        if (payment.job_id) {
          await storage.updateJob(payment.job_id, { status: "cancelled" });
        }
      }
      break;
    }

    case "subscription_created": {
      const tier = detectTierFromVariant(attrs.variant_id);
      await storage.upsertSubscription(userId, {
        tier,
        status: "active",
        ls_subscription_id: String(payload.data.id),
        ls_customer_id: String(attrs.customer_id),
        ls_variant_id: String(attrs.variant_id),
        current_period_start: new Date(attrs.renews_at),
        current_period_end: new Date(attrs.ends_at ?? attrs.renews_at),
        proposals_left: SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]?.proposalsPerMonth ?? 3,
        job_posts_left: SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]?.jobPostsPerMonth ?? 0,
      });

      // Referral bonus processing
      const profile = await storage.getProfileByUserId(userId);
      if (profile?.referred_by) {
        const referral = (await storage.getReferralsByReferrer(profile.referred_by)).find(r => r.referred_id === userId);
        if (referral && !referral.bonus_paid) {
          const bonusAmount = (attrs.total / 100) * 0.20; // 20% referral bonus
          await storage.updateReferral(referral.id, { bonus_amount: bonusAmount, bonus_paid: true, first_payment_at: new Date() });
          await storage.createNotification({
            user_id: profile.referred_by,
            type: "referral_bonus",
            title: "Referral Bonus Earned!",
            body: `You earned $${bonusAmount.toFixed(2)} from a referral. Great work!`,
            link: "/dashboard/referrals",
            is_read: false,
          });
        }
      }
      break;
    }

    case "subscription_updated": {
      const sub = await storage.getSubscriptionByLsId(String(payload.data.id));
      if (sub) {
        const tier = detectTierFromVariant(attrs.variant_id);
        await storage.upsertSubscription(sub.user_id, {
          tier,
          status: mapLSStatus(attrs.status),
          current_period_end: new Date(attrs.ends_at ?? attrs.renews_at),
          cancel_at_period_end: attrs.cancelled ?? false,
        });
      }
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired": {
      const sub = await storage.getSubscriptionByLsId(String(payload.data.id));
      if (sub) {
        await storage.upsertSubscription(sub.user_id, {
          status: event === "subscription_cancelled" ? "cancelled" : "expired",
          tier: "free",
          proposals_left: 3,
          job_posts_left: 0,
        });
        await storage.createNotification({
          user_id: sub.user_id,
          type: "subscription_cancelled",
          title: "Subscription Cancelled",
          body: "Your subscription has been cancelled. You have been moved to the Free tier.",
          link: "/pricing",
          is_read: false,
        });
      }
      break;
    }

    case "subscription_payment_success": {
      const sub = await storage.getSubscriptionByLsId(String(attrs.subscription_id));
      if (sub) {
        await storage.createPayment({
          user_id: sub.user_id,
          amount: attrs.total / 100,
          currency: "USD",
          method: "lemon_squeezy",
          status: "completed",
          ls_order_id: String(payload.data.id),
          description: `Subscription renewal: ${sub.tier}`,
        });
        // Reset monthly allowances
        const plan = SUBSCRIPTION_PLANS[sub.tier as keyof typeof SUBSCRIPTION_PLANS] as any;
        await storage.upsertSubscription(sub.user_id, {
          proposals_left: plan?.proposalsPerMonth === -1 ? 9999 : plan?.proposalsPerMonth ?? 3,
          job_posts_left: plan?.jobPostsPerMonth === -1 ? 9999 : plan?.jobPostsPerMonth ?? 0,
          current_period_end: new Date(attrs.next_billing_date),
        });
      }
      break;
    }

    case "subscription_payment_failed": {
      const sub = await storage.getSubscriptionByLsId(String(attrs.subscription_id));
      if (sub) {
        await storage.upsertSubscription(sub.user_id, { status: "past_due" });
        await storage.createNotification({
          user_id: sub.user_id,
          type: "payment_failed",
          title: "Payment Failed",
          body: "Your subscription payment failed. Please update your payment method.",
          link: "/dashboard/billing",
          is_read: false,
        });
      }
      break;
    }
  }
}

function detectTierFromVariant(variantId: string | number): "basic" | "premium" | "enterprise" {
  const id = String(variantId);
  if (id === process.env.LS_VARIANT_ENTERPRISE) return "enterprise";
  if (id === process.env.LS_VARIANT_PREMIUM) return "premium";
  return "basic";
}

function mapLSStatus(status: string): "active" | "cancelled" | "expired" | "trialing" | "past_due" {
  const map: Record<string, any> = { active: "active", cancelled: "cancelled", expired: "expired", on_trial: "trialing", past_due: "past_due", unpaid: "past_due" };
  return map[status] ?? "active";
}

// ─── BSC / BUSD Payment Verification ─────────────────────────────────────────
const BSC_RPC = "https://bsc-dataseed.binance.org/";
const BUSD_CONTRACT = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS ?? "";

const BUSD_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)",
];

let provider: ethers.JsonRpcProvider | null = null;
function getBscProvider() {
  if (!provider) provider = new ethers.JsonRpcProvider(BSC_RPC);
  return provider;
}

export async function verifyBusdPayment(opts: {
  txHash: string;
  expectedAmount: number;
  fromWallet: string;
}): Promise<{ valid: boolean; amount: number; error?: string }> {
  try {
    const provider = getBscProvider();
    const receipt = await provider.getTransactionReceipt(opts.txHash);
    if (!receipt || receipt.status !== 1) {
      return { valid: false, amount: 0, error: "Transaction failed or not found" };
    }

    const busd = new ethers.Contract(BUSD_CONTRACT, BUSD_ABI, provider);
    const events = await busd.queryFilter(busd.filters.Transfer(null, PLATFORM_WALLET), receipt.blockNumber, receipt.blockNumber);

    for (const event of events) {
      if ("args" in event && event.transactionHash.toLowerCase() === opts.txHash.toLowerCase()) {
        const amount = parseFloat(ethers.formatUnits(event.args.value, 18));
        const fromMatch = event.args.from.toLowerCase() === opts.fromWallet.toLowerCase();
        if (fromMatch && amount >= opts.expectedAmount * 0.99) {
          return { valid: true, amount };
        }
      }
    }
    return { valid: false, amount: 0, error: "Transfer to platform wallet not found in transaction" };
  } catch (err: any) {
    return { valid: false, amount: 0, error: err.message };
  }
}

export async function processBusdJobPayment(opts: {
  userId: string;
  jobId: string;
  txHash: string;
  fromWallet: string;
  expectedAmount: number;
}) {
  const { valid, amount, error } = await verifyBusdPayment(opts);
  if (!valid) throw new Error(error ?? "Payment verification failed");

  const payment = await storage.createPayment({
    user_id: opts.userId,
    job_id: opts.jobId,
    amount,
    currency: "BUSD",
    method: "busd_bsc",
    status: "completed",
    tx_hash: opts.txHash,
    from_wallet: opts.fromWallet,
    to_wallet: PLATFORM_WALLET,
    description: "Job post payment (BUSD)",
  });

  await storage.updateJob(opts.jobId, { status: "active", payment_tx_hash: opts.txHash });
  return payment;
}

export async function processBusdSubscription(opts: {
  userId: string;
  tier: "basic" | "premium" | "enterprise";
  txHash: string;
  fromWallet: string;
}) {
  const plan = SUBSCRIPTION_PLANS[opts.tier] as any;
  const { valid, amount, error } = await verifyBusdPayment({
    txHash: opts.txHash,
    expectedAmount: plan.priceBUSD,
    fromWallet: opts.fromWallet,
  });
  if (!valid) throw new Error(error ?? "Payment verification failed");

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const sub = await storage.upsertSubscription(opts.userId, {
    tier: opts.tier,
    status: "active",
    current_period_start: now,
    current_period_end: periodEnd,
    proposals_left: plan.proposalsPerMonth === -1 ? 9999 : plan.proposalsPerMonth,
    job_posts_left: plan.jobPostsPerMonth === -1 ? 9999 : plan.jobPostsPerMonth,
  });

  await storage.createPayment({
    user_id: opts.userId,
    amount,
    currency: "BUSD",
    method: "busd_bsc",
    status: "completed",
    tx_hash: opts.txHash,
    from_wallet: opts.fromWallet,
    to_wallet: PLATFORM_WALLET,
    description: `Subscription: ${opts.tier} (BUSD)`,
  });

  return sub;
}
