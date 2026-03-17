import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Shield, Zap, Globe, Star, Users, Briefcase, DollarSign, CheckCircle2, TrendingUp, Lock } from "lucide-react";
import { LogoFull } from "@/components/Logo";
import { SUBSCRIPTION_PLANS } from "@shared/schema";

const STATS = [
  { label: "Active Jobs", value: "2,400+", icon: Briefcase },
  { label: "Vetted Freelancers", value: "12,000+", icon: Users },
  { label: "Paid Out", value: "$4.2M+", icon: DollarSign },
  { label: "Countries", value: "85+", icon: Globe },
];

const FEATURES = [
  { icon: Shield, title: "BSC Escrow Protection", desc: "Smart contract escrow on Binance Smart Chain. Funds only release when work is approved — zero trust required." },
  { icon: Zap, title: "Pay with Crypto or Card", desc: "BUSD on BSC or credit/debit card via Lemon Squeezy. Multiple currencies, no geographic restrictions." },
  { icon: Globe, title: "Global Web3 Talent", desc: "Access verified blockchain developers, DeFi specialists, NFT artists, and Web3 marketers worldwide." },
  { icon: Lock, title: "Enterprise Security", desc: "Rate limiting, XSS/CSRF protection, encrypted data, and email verification on every account." },
  { icon: TrendingUp, title: "Real-time Analytics", desc: "Track proposals, earnings, and growth with live dashboards for both freelancers and employers." },
  { icon: Star, title: "Verified Reviews", desc: "On-chain reputation scores and review systems ensure you always work with trusted professionals." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create Your Account", desc: "Sign up free in 60 seconds. Choose freelancer or employer. Verify your email to unlock all features." },
  { step: "02", title: "Browse or Post Jobs", desc: "Employers post Web3 jobs (paid per post or via subscription). Freelancers browse and submit targeted proposals." },
  { step: "03", title: "Collaborate Safely", desc: "Use our integrated chat and milestone system. Funds are held in BSC escrow until work is complete." },
  { step: "04", title: "Get Paid Instantly", desc: "Release funds to freelancer's wallet the moment you approve the work. BUSD arrives in seconds." },
];

export default function Landing() {
  const { data: statsData } = useQuery<any>({ queryKey: ["/api/health"] });

  return (
    <div className="min-h-screen">
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden hero-grid min-h-[92vh] flex items-center">
        {/* Gold orb background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="border-primary/40 text-primary mb-6 px-4 py-1.5 text-sm">
              🚀 The #1 Web3 Jobs Marketplace — Powered by BSC
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Find Top Web3 Talent.{" "}
              <span className="text-primary">Pay with Crypto</span>{" "}
              or Card.
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect with vetted blockchain developers, DeFi experts, and Web3 specialists.
              Smart contract escrow on BSC. No chargebacks. No borders.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register?role=employer">
                <Button size="lg" className="gold-gradient text-black font-bold px-8 h-12 text-base hover:opacity-90 glow-gold" data-testid="hero-employer-cta">
                  Post a Job <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register?role=freelancer">
                <Button size="lg" variant="outline" className="border-border h-12 px-8 text-base hover:border-primary/50" data-testid="hero-freelancer-cta">
                  Find Work Free
                </Button>
              </Link>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-primary">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-card/30" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for the Web3 Economy</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to work and hire globally in the decentralized economy.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <Card key={f.title} className="dark-card hover:border-primary/40 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────── */}
      <section className="py-24" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How Web3Work Works</h2>
            <p className="text-muted-foreground text-lg">Four simple steps from posting to payment</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-border -z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-black font-bold text-sm mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Preview ──────────────────────────────────────────── */}
      <section className="py-24 bg-card/30" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">Pay with BUSD on BSC or credit card. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(["basic", "premium", "enterprise"] as const).map((tier) => {
              const plan = SUBSCRIPTION_PLANS[tier] as any;
              const isPopular = tier === "premium";
              return (
                <Card key={tier} className={`dark-card relative ${isPopular ? "border-primary/60 glow-gold" : ""}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gold-gradient text-black font-semibold">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-2 badge-tier-${tier} inline-flex px-2 py-0.5 rounded`}>
                      {plan.name}
                    </div>
                    <div className="my-4">
                      <span className="text-3xl font-bold">${plan.priceUSD}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((f: string) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/checkout/subscription?tier=${tier}`}>
                      <Button className={`w-full ${isPopular ? "gold-gradient text-black font-semibold" : ""}`} variant={isPopular ? "default" : "outline"} data-testid={`btn-plan-${tier}`}>
                        Get {plan.name}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-center text-muted-foreground mt-8 text-sm">
            Or pay per job post starting at $9.99 · <Link href="/pricing"><span className="text-primary hover:underline">View full pricing →</span></Link>
          </p>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="dark-card p-12 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 hero-grid opacity-30" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Earning in Web3?</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Join 12,000+ professionals already building the decentralized future.
                Your first 3 proposals are free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="gold-gradient text-black font-bold px-8 h-12 hover:opacity-90">
                    Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button size="lg" variant="outline" className="h-12 px-8">Browse Open Jobs</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <LogoFull size={28} />
              <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                The decentralized jobs marketplace for Web3 professionals worldwide.
              </p>
            </div>
            {[
              { title: "Platform", links: [["Browse Jobs", "/jobs"], ["Post a Job", "/post-job"], ["Pricing", "/pricing"]] },
              { title: "Company", links: [["About", "/about"], ["Blog", "/blog"], ["Contact", "/contact"]] },
              { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold mb-3 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={href}><Link href={href}><span className="text-muted-foreground hover:text-foreground text-sm transition-colors">{label}</span></Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">© 2024 Web3Work. All rights reserved.</p>
            <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Created with Perplexity Computer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
