import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Lock, CreditCard, Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { SUBSCRIPTION_PLANS } from "@shared/schema";
import { Navigate } from "./Navigate";

export default function Checkout() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const tier = (params.get("tier") ?? "premium") as "basic" | "premium" | "enterprise";
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to={`/register?redirect=/checkout/subscription?tier=${tier}`} />;

  return <CheckoutContent tier={tier} />;
}

function CheckoutContent({ tier }: { tier: "basic" | "premium" | "enterprise" }) {
  const plan = SUBSCRIPTION_PLANS[tier] as any;
  const [payMethod, setPayMethod] = useState<"card" | "crypto">("card");
  const [txHash, setTxHash] = useState("");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  async function handleCardCheckout() {
    setLoading(true); setError("");
    try {
      const res = await apiRequest("POST", "/api/payments/checkout/subscription", { tier });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleCryptoPayment() {
    if (!txHash || !wallet) return;
    setLoading(true); setError("");
    try {
      const res = await apiRequest("POST", "/api/payments/crypto/subscription", { tier, txHash, fromWallet: wallet });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate("/dashboard?subscription=success");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Badge className={`badge-tier-${tier} px-3 py-1 text-sm mb-3`}>{plan.name} Plan</Badge>
        <h1 className="text-2xl font-bold">Complete Your Upgrade</h1>
        <p className="text-muted-foreground text-sm mt-1">Unlock more proposals, job posts, and features</p>
      </div>

      <Card className="dark-card border-primary/30 mb-6">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">{plan.name} Subscription</span>
            <span className="text-xl font-bold text-primary">${plan.priceUSD}<span className="text-sm text-muted-foreground">/mo</span></span>
          </div>
          <ul className="space-y-2">
            {plan.features.map((f: string) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{f}
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
            <span className="text-muted-foreground">Billed monthly</span>
            <span className="font-semibold">${plan.priceUSD} USD or {plan.priceBUSD} BUSD</span>
          </div>
        </CardContent>
      </Card>

      <Card className="dark-card">
        <CardHeader>
          <CardTitle className="text-base">Choose Payment Method</CardTitle>
          <CardDescription>Pay with crypto (BUSD on BSC) or credit/debit card</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPayMethod("card")} className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${payMethod === "card" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`} data-testid="btn-pay-card">
              <CreditCard className="h-4 w-4" />Card / Fiat
            </button>
            <button onClick={() => setPayMethod("crypto")} className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${payMethod === "crypto" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`} data-testid="btn-pay-crypto">
              <Coins className="h-4 w-4" />BUSD (BSC)
            </button>
          </div>

          {payMethod === "card" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-secondary/50 rounded-lg">
                <Lock className="h-3.5 w-3.5" />
                Powered by Lemon Squeezy · Secure checkout · All major cards accepted
              </div>
              <Button className="w-full gold-gradient text-black font-bold h-11" onClick={handleCardCheckout} disabled={loading} data-testid="btn-checkout-card">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Pay ${plan.priceUSD}/month
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg text-xs space-y-2">
                <p className="font-semibold text-sm">Send {plan.priceBUSD} BUSD to:</p>
                <p className="font-mono text-primary break-all">{import.meta.env.VITE_PLATFORM_WALLET ?? "Configure VITE_PLATFORM_WALLET in .env"}</p>
                <p className="text-muted-foreground">Network: <strong className="text-foreground">BSC (BEP-20)</strong></p>
                <p className="text-muted-foreground">Token: <strong className="text-foreground">BUSD — 0xe9e7CE...087D56</strong></p>
              </div>
              <div>
                <Label className="text-xs">Your BSC Wallet</Label>
                <Input placeholder="0x..." value={wallet} onChange={e => setWallet(e.target.value)} className="mt-1.5 font-mono text-sm" data-testid="input-wallet-checkout" />
              </div>
              <div>
                <Label className="text-xs">Transaction Hash</Label>
                <Input placeholder="0x..." value={txHash} onChange={e => setTxHash(e.target.value)} className="mt-1.5 font-mono text-sm" data-testid="input-txhash-checkout" />
              </div>
              <Button className="w-full gold-gradient text-black font-bold h-11" onClick={handleCryptoPayment} disabled={loading || !txHash || !wallet} data-testid="btn-verify-crypto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Verify & Activate
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">Cancel anytime · No lock-in · Instant access after payment</p>
        </CardContent>
      </Card>
    </div>
  );
}
