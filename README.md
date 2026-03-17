# Web3Work v2 — Production-Ready Jobs Marketplace

The decentralized jobs marketplace for Web3 professionals. Built with Next.js (Express + Vite), Supabase PostgreSQL, Lemon Squeezy payments, and BUSD on BSC.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Express.js + TypeScript |
| Database | Supabase (PostgreSQL) + Drizzle ORM |
| Auth | Custom JWT (bcryptjs + jsonwebtoken) |
| Fiat Payments | Lemon Squeezy (supports Morocco/worldwide) |
| Crypto Payments | BUSD on Binance Smart Chain (ethers.js) |
| Email | Nodemailer (SMTP) |
| Security | Helmet, express-rate-limit, CSRF tokens |
| Deployment | Vercel (frontend + API proxy) |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Lemon Squeezy](https://app.lemonsqueezy.com) account
- A BSC wallet address to receive payments

### 2. Install dependencies

```bash
cd web3work-production
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 4. Set up Supabase database

1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor** → **New Query**
3. Copy and run the contents of `supabase/schema.sql`
4. Copy your project URL and API keys to `.env`

### 5. Set up Lemon Squeezy

1. Create account at https://app.lemonsqueezy.com/register
2. Create a **Store** (you can use your name/brand as the store)
3. Create **Products** with the following variants:
   - Basic Plan — $19/month (recurring)
   - Premium Plan — $49/month (recurring)
   - Enterprise Plan — $199/month (recurring)
   - Standard Job Post — $9.99 (one-time)
   - Featured Job Post — $29.99 (one-time)
4. Copy each variant's ID to `.env`
5. Set up a webhook pointing to `https://your-domain.com/api/webhooks/lemonsqueezy`
   - Events: `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_payment_success`, `subscription_payment_failed`
6. Copy the webhook secret to `.env` as `LS_WEBHOOK_SECRET`

### 6. Run development server

```bash
npm run dev
```

App runs at `http://localhost:5000`

---

## 📦 Deployment on Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "feat: Web3Work v2 production ready"
git remote add origin https://github.com/yourusername/web3work.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist/public`
5. Add all environment variables from `.env.example`

### Step 3: Configure domains

1. Add your custom domain in Vercel Dashboard → Domains
2. Update `APP_URL` in environment variables

---

## 🔐 Security Features

| Feature | Implementation |
|---|---|
| Rate Limiting | `express-rate-limit` — 10 req/15min for auth, 100 req/min for API |
| Security Headers | `helmet` — CSP, HSTS, XSS protection, frame options |
| Password Hashing | `bcryptjs` with cost factor 12 |
| JWT Auth | 7-day tokens, Bearer scheme, auto-expire |
| Email Verification | Token-based, 24-hour expiry |
| CSRF Protection | Token endpoint at `/api/csrf-token` |
| SQL Injection | Drizzle ORM parameterized queries |
| RLS | Supabase Row Level Security on all tables |

---

## 💰 Monetization Model

### Revenue Streams
1. **Job Posts**: $9.99 (standard) / $29.99 (featured) per post
2. **Freelancer Subscriptions**: $19 / $49 / $199 per month
3. **Platform Fee**: 2.5% on BSC escrow releases
4. **Referral System**: 20% of referred user's first payment

### Payment Methods
- **Lemon Squeezy** (Morocco-compatible, worldwide sellers): Credit/debit cards, Apple Pay, Google Pay
- **BUSD on BSC**: Direct wallet transfer, verified via BSC transaction hash

---

## 🏦 Subscription Plans

| Plan | Price | Proposals/mo | Job Posts/mo |
|---|---|---|---|
| Free | $0 | 3 | 0 |
| Basic | $19 | 20 | 3 |
| Premium | $49 | Unlimited | 10 |
| Enterprise | $199 | Unlimited | Unlimited |

---

## 📁 Project Structure

```
web3work-production/
├── client/src/
│   ├── contexts/       # AuthContext
│   ├── lib/            # queryClient, auth helpers
│   ├── pages/          # Landing, Jobs, PostJob, Dashboard, Admin, Checkout, Auth
│   ├── components/     # Navbar, Logo, PerplexityAttribution + shadcn/ui
│   └── App.tsx         # Router
├── server/
│   ├── routes.ts       # All API routes (auth, jobs, payments, admin, webhooks)
│   ├── storage.ts      # Supabase + in-memory storage implementations
│   ├── auth.ts         # JWT + bcrypt helpers + middleware
│   ├── payments.ts     # Lemon Squeezy + BUSD/BSC payment processing
│   ├── email.ts        # Nodemailer email templates
│   └── index.ts        # Express server entry
├── shared/
│   └── schema.ts       # Drizzle ORM schema + Zod schemas + subscription plans
├── supabase/
│   └── schema.sql      # Full PostgreSQL schema with RLS + triggers
├── .env.example        # All required environment variables
└── README.md           # This file
```

---

## 🔗 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account + auto-create profile + subscription |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/forgot-password` | Send reset email |

### Jobs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs` | No | Browse active jobs (paginated, filterable) |
| GET | `/api/jobs/:id` | No | Job detail + increment view count |
| POST | `/api/jobs` | Employer | Create job (checks subscription credits) |
| PATCH | `/api/jobs/:id` | Owner | Update job |
| GET | `/api/jobs/employer/mine` | Employer | My posted jobs |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/pricing` | No | All plans + prices |
| POST | `/api/payments/checkout/job` | Yes | Create LS checkout for job post |
| POST | `/api/payments/checkout/subscription` | Yes | Create LS subscription checkout |
| POST | `/api/payments/crypto/job` | Yes | Verify BUSD tx for job post |
| POST | `/api/payments/crypto/subscription` | Yes | Verify BUSD tx for subscription |
| GET | `/api/payments/history` | Yes | My payment history |
| POST | `/api/webhooks/lemonsqueezy` | Webhook | Process LS events |

---

## 🌍 Why Lemon Squeezy instead of Stripe?

Stripe does not support Morocco as a business registration country. Lemon Squeezy:
- ✅ Accepts sellers from Morocco and 160+ countries
- ✅ Acts as Merchant of Record (handles VAT automatically)
- ✅ Supports recurring subscriptions
- ✅ Instant payouts to international bank accounts
- ✅ GDPR-compliant

---

## 📞 Support

- Email: support@web3work.io  
- Website: https://web3work.io  
- Built with [Perplexity Computer](https://www.perplexity.ai/computer)
