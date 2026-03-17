import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Users, Briefcase, Gift } from "lucide-react";
import { SUBSCRIPTION_PLANS, JOB_POST_PRICES } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

const TIER_ORDER = ["free", "basic", "premium", "enterprise"] as const;
const COMPARISON = [
  ["Proposals per month", "3", "20", "Unlimited", "Unlimited"],
  ["Job posts per month", "0", "3", "10", "Unlimited"],
  ["Featured listing", "—", "1/month", "Always", "Always"],
  ["Analytics dashboard", "Basic", "Standard", "Advanced", "Enterprise"],
  ["Support", "Community", "Email", "Priority", "Dedicated"],
  ["API access", "—", "—", "—", "✓"],
  ["Custom branding", "—", "—", "—", "✓"],
];

export default function Pricing() {
  const { subscription } = useAuth();
  const currentTier = subscription?.tier ?? "free";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <Badge variant="outline" className="border-primary/40 text-primary mb-4">Transparent Pricing</Badge>
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Pay with BUSD on BSC or credit/debit card. No geographic restrictions. Cancel anytime.
        </p>
      </div>

      {/* Subscription plans */}
      <div className="grid md:grid-cols-4 gap-5 mb-20">
        {TIER_ORDER.map((tier) => {
          const plan = SUBSCRIPTION_PLANS[tier] as any;
          const isPopular = tier === "premium";
          const isCurrent = currentTier === tier;
          return (
            <Card key={tier} className={`dark-card relative flex flex-col ${isPopular ? "border-primary/60 glow-gold" : ""}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="gold-gradient text-black font-semibold text-xs px-3">Most Popular</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-3 z-10">
                  <Badge variant="secondary" className="text-xs">Current Plan</Badge>
                </div>
              )}
              <CardContent className="p-6 flex flex-col flex-1">
                <div className={`text-xs font-semibold uppercase tracking-widest mb-3 badge-tier-${tier} inline-flex px-2 py-0.5 rounded w-fit`}>
                  {plan.name}
                </div>
                <div className="mb-5">
                  {tier === "free" ? (
                    <div className="text-3xl font-bold">Free</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold">${plan.priceUSD}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">per month · or {plan.priceBUSD} BUSD</div>
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {tier === "free" ? (
                  <Link href="/register">
                    <Button variant="outline" className="w-full">Get Started Free</Button>
                  </Link>
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                ) : (
                  <Link href={`/checkout/subscription?tier=${tier}`}>
                    <Button
                      className={`w-full ${isPopular ? "gold-gradient text-black font-semibold" : ""}`}
                      variant={isPopular ? "default" : "outline"}
                      data-testid={`btn-plan-${tier}`}
                    >
                      Upgrade to {plan.name}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Job Post pricing */}
      <div className="mb-20">
        <h2 className="text-xl font-bold mb-6 text-center">Per-Post Job Pricing</h2>
        <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {(["standard", "featured"] as const).map(type => {
            const price = JOB_POST_PRICES[type];
            return (
              <Card key={type} className="dark-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold capitalize">{type} Job Post</div>
                      <div className="text-2xl font-bold text-primary mt-1">${price.usd}</div>
                      <div className="text-xs text-muted-foreground">or {price.busd} BUSD on BSC</div>
                    </div>
                    {type === "featured" && <Badge className="gold-gradient text-black text-xs">⭐ Top Placement</Badge>}
                  </div>
                  <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                    {type === "standard"
                      ? ["Active 30 days", "Unlimited proposals", "Standard placement"].map(f => <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{f}</li>)
                      : ["Active 30 days", "Unlimited proposals", "Featured badge + top placement", "2× more visibility"].map(f => <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{f}</li>)
                    }
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      <div className="mb-16">
        <h2 className="text-xl font-bold mb-6 text-center">Full Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Feature</th>
                {TIER_ORDER.map(t => <th key={t} className="text-center py-3 px-4 font-medium capitalize">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([feature, ...values]) => (
                <tr key={feature} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground">{feature}</td>
                  {values.map((v, i) => (
                    <td key={i} className={`py-3 px-4 text-center ${v === "—" ? "text-muted-foreground/40" : v === "✓" ? "text-primary" : "text-foreground"}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral program */}
      <div className="dark-card p-8 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Gift className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Earn 20% Referral Commission</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Refer a friend to Web3Work and earn 20% of their first payment. Share your unique referral link and watch your earnings grow.
        </p>
        <Link href="/dashboard/referrals">
          <Button className="gold-gradient text-black font-semibold">Get Your Referral Link</Button>
        </Link>
      </div>
    </div>
  );
}
