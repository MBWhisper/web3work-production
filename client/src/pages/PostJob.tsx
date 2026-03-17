import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Briefcase, DollarSign, X, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

const jobSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  category: z.string().min(1, "Select a category"),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  budgetCurrency: z.string().default("USDT"),
  isFixed: z.boolean().default(true),
  experienceLevel: z.string().default("mid"),
  deadline: z.string().optional(),
});

const CATEGORIES = ["Smart Contract", "Frontend", "Backend", "DeFi", "NFT", "Security", "Design", "Marketing", "Content", "DevOps", "Mobile"];
const EXP_LEVELS = [["entry", "Entry Level"], ["mid", "Mid Level"], ["senior", "Senior"], ["expert", "Expert"]];

export default function PostJob() {
  const [, navigate] = useLocation();
  const { user, subscription, isAuthenticated } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [createdJobId, setCreatedJobId] = useState("");

  const form = useForm({ resolver: zodResolver(jobSchema), defaultValues: { title: "", description: "", category: "", budgetMin: "", budgetMax: "", budgetCurrency: "USDT", isFixed: true, experienceLevel: "mid", deadline: "" } });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await apiRequest("POST", "/api/jobs", {
        ...values,
        budget_min: values.budgetMin ? parseFloat(values.budgetMin) : null,
        budget_max: values.budgetMax ? parseFloat(values.budgetMax) : null,
        budget_currency: values.budgetCurrency,
        is_fixed: values.isFixed,
        experience_level: values.experienceLevel,
        deadline: values.deadline || null,
        tags,
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment) {
        setCreatedJobId(data.job.id);
        setShowPaywall(true);
      } else {
        navigate("/dashboard/jobs?success=true");
      }
    },
    onError: (err: any) => setError(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
        <p className="text-muted-foreground mb-6">Create an employer account to post jobs.</p>
        <Link href="/register?role=employer"><Button className="gold-gradient text-black font-semibold">Create Employer Account</Button></Link>
      </div>
    );
  }

  if (user?.role === "freelancer") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">Employer Account Required</h2>
        <p className="text-muted-foreground mb-6">Job posting is available for employer accounts. Create a new employer account to get started.</p>
        <Link href="/register?role=employer"><Button className="gold-gradient text-black">Register as Employer</Button></Link>
      </div>
    );
  }

  if (showPaywall) {
    return <PaywallScreen jobId={createdJobId} onBack={() => setShowPaywall(false)} />;
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 8) { setTags([...tags, t]); setTagInput(""); }
  };

  const jobPostsLeft = subscription?.job_posts_left ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Post a Job</h1>
        <p className="text-muted-foreground text-sm">
          {jobPostsLeft > 0
            ? <span className="text-primary">✓ You have {jobPostsLeft} job post credits remaining</span>
            : "One-time payment: $9.99 USD or 9.99 BUSD"}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(v => createMutation.mutate(v))} className="space-y-6">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card className="dark-card">
          <CardHeader><CardTitle className="text-base">Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Job Title *</Label>
              <Input placeholder="e.g. Senior Solidity Developer for DeFi Protocol" {...form.register("title")} data-testid="input-job-title" className="mt-1.5" />
              {form.formState.errors.title && <p className="text-destructive text-xs mt-1">{form.formState.errors.title.message}</p>}
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the role, requirements, deliverables, and what makes your project exciting..."
                rows={8}
                {...form.register("description")}
                data-testid="input-job-description"
                className="mt-1.5"
              />
              {form.formState.errors.description && <p className="text-destructive text-xs mt-1">{form.formState.errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select onValueChange={v => form.setValue("category", v)}>
                  <SelectTrigger className="mt-1.5" data-testid="select-job-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Experience Level</Label>
                <Select defaultValue="mid" onValueChange={v => form.setValue("experienceLevel", v)}>
                  <SelectTrigger className="mt-1.5" data-testid="select-exp-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {EXP_LEVELS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tags (up to 8)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="e.g. solidity, react, web3.js"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  data-testid="input-tag"
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1 pr-1">
                      {t}<button type="button" onClick={() => setTags(tags.filter(x => x !== t))}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardHeader><CardTitle className="text-base">Budget & Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Min Budget</Label>
                <Input type="number" placeholder="500" {...form.register("budgetMin")} className="mt-1.5" data-testid="input-budget-min" />
              </div>
              <div>
                <Label>Max Budget</Label>
                <Input type="number" placeholder="2000" {...form.register("budgetMax")} className="mt-1.5" data-testid="input-budget-max" />
              </div>
              <div>
                <Label>Currency</Label>
                <Select defaultValue="USDT" onValueChange={v => form.setValue("budgetCurrency", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["USDT", "BUSD", "BNB", "USD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Deadline (optional)</Label>
              <Input type="date" {...form.register("deadline")} className="mt-1.5" data-testid="input-deadline" />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full gold-gradient text-black font-bold h-11"
          disabled={createMutation.isPending}
          data-testid="btn-post-job-submit"
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {jobPostsLeft > 0 ? "Post Job Now (Free)" : "Continue to Payment →"}
        </Button>
      </form>
    </div>
  );
}

function PaywallScreen({ jobId, onBack }: { jobId: string; onBack: () => void }) {
  const [payMethod, setPayMethod] = useState<"card" | "crypto">("card");
  const [txHash, setTxHash] = useState("");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  async function handleCardPayment() {
    setLoading(true); setError("");
    try {
      const res = await apiRequest("POST", "/api/payments/checkout/job", { jobId, featured: false });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else setError("Failed to create checkout session");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleCryptoPayment() {
    setLoading(true); setError("");
    try {
      const res = await apiRequest("POST", "/api/payments/crypto/job", { jobId, txHash, fromWallet: wallet });
      const data = await res.json();
      if (data.success) navigate("/dashboard/jobs?payment=success");
      else setError(data.error ?? "Payment verification failed");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Card className="dark-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Activate Your Job Post</CardTitle>
          <CardDescription>Your job was saved as a draft. Complete payment to make it live.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="dark-card p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Standard Job Post</span>
              <span className="text-primary font-bold">$9.99 / 9.99 BUSD</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">Active for 30 days · Unlimited proposals</span>
              <span className="text-xs text-muted-foreground">BSC or Card</span>
            </div>
          </div>

          {/* Payment method tabs */}
          <div className="grid grid-cols-2 gap-2">
            {[["card", "💳 Pay with Card"], ["crypto", "🟡 Pay with BUSD"]].map(([m, label]) => (
              <button
                key={m}
                onClick={() => setPayMethod(m as any)}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${payMethod === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {payMethod === "card" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">You'll be redirected to our secure Lemon Squeezy checkout. Supports all major cards.</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />Secure · SSL encrypted · No card data stored
              </div>
              <Button className="w-full gold-gradient text-black font-semibold" onClick={handleCardPayment} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Pay $9.99 with Card →
              </Button>
            </div>
          )}

          {payMethod === "crypto" && (
            <div className="space-y-3">
              <div className="dark-card p-4 rounded-lg bg-secondary/50 text-xs space-y-1.5">
                <p className="font-semibold text-sm mb-2">Send exactly 9.99 BUSD to:</p>
                <p className="font-mono text-primary break-all">{import.meta.env.VITE_PLATFORM_WALLET ?? "0x... (configure VITE_PLATFORM_WALLET)"}</p>
                <p className="text-muted-foreground">Network: <span className="text-foreground font-medium">Binance Smart Chain (BSC)</span></p>
                <p className="text-muted-foreground">Token: <span className="text-foreground font-medium">BUSD (BEP-20)</span></p>
              </div>
              <div>
                <Label className="text-xs">Your BSC Wallet Address</Label>
                <Input placeholder="0x..." value={wallet} onChange={e => setWallet(e.target.value)} className="mt-1.5 font-mono text-sm" data-testid="input-wallet" />
              </div>
              <div>
                <Label className="text-xs">Transaction Hash (after sending)</Label>
                <Input placeholder="0x..." value={txHash} onChange={e => setTxHash(e.target.value)} className="mt-1.5 font-mono text-sm" data-testid="input-tx-hash" />
              </div>
              <Button className="w-full gold-gradient text-black font-semibold" onClick={handleCryptoPayment} disabled={loading || !txHash || !wallet}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Verify Payment
              </Button>
            </div>
          )}

          <button onClick={onBack} className="w-full text-sm text-muted-foreground hover:text-foreground">← Back to editing</button>
        </CardContent>
      </Card>
    </div>
  );
}
