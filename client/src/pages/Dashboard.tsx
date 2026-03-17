import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Briefcase, DollarSign, Users, TrendingUp, Plus, Bell, Star,
  Copy, Check, ArrowUpRight, Clock, CheckCircle2, XCircle, Gift
} from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { SUBSCRIPTION_PLANS } from "@shared/schema";
import { Navigate } from "./Navigate";

export default function Dashboard() {
  const { user, profile, subscription, isAuthenticated, isLoading } = useAuth();
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {profile?.display_name} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.role === "employer" ? "Manage your job postings and candidates" : "Track your proposals and earnings"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`badge-tier-${subscription?.tier ?? "free"} px-3 py-1`}>
            {(subscription?.tier ?? "free").toUpperCase()} PLAN
          </Badge>
          {user?.role === "employer" ? (
            <Link href="/post-job"><Button size="sm" className="gold-gradient text-black font-semibold"><Plus className="h-4 w-4 mr-1" />Post Job</Button></Link>
          ) : (
            <Link href="/jobs"><Button size="sm" variant="outline"><ArrowUpRight className="h-4 w-4 mr-1" />Browse Jobs</Button></Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-card border border-border mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">{user?.role === "employer" ? "My Jobs" : "Proposals"}</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        {/* Jobs / Proposals */}
        <TabsContent value="jobs">
          {user?.role === "employer" ? <EmployerJobsTab /> : <FreelancerProposalsTab />}
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>

        {/* Referrals */}
        <TabsContent value="referrals">
          <ReferralsTab />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab() {
  const { user, profile, subscription } = useAuth();

  const { data: jobsData } = useQuery<any>({
    queryKey: user?.role === "employer" ? ["/api/jobs/employer/mine"] : ["/api/proposals/mine"],
    enabled: !!user,
  });

  const { data: paymentsData } = useQuery<any>({ queryKey: ["/api/payments/history"] });

  const jobsCount = jobsData?.jobs?.length ?? jobsData?.proposals?.length ?? 0;
  const totalSpent = paymentsData?.payments?.filter((p: any) => p.status === "completed").reduce((s: number, p: any) => s + p.amount, 0) ?? 0;
  const activeJobs = jobsData?.jobs?.filter((j: any) => j.status === "active").length ?? 0;

  const stats = user?.role === "employer" ? [
    { label: "Total Jobs Posted", value: jobsCount, icon: Briefcase, color: "text-primary" },
    { label: "Active Listings", value: activeJobs, icon: TrendingUp, color: "text-success" },
    { label: "Total Spent", value: `$${totalSpent.toFixed(2)}`, icon: DollarSign, color: "text-warning" },
    { label: "Proposals Left", value: subscription?.proposals_left ?? 0, icon: Users, color: "text-info" },
  ] : [
    { label: "Proposals Sent", value: jobsCount, icon: Briefcase, color: "text-primary" },
    { label: "Proposals Left", value: subscription?.proposals_left ?? 0, icon: TrendingUp, color: "text-success" },
    { label: "Rating", value: profile?.rating ? `${profile.rating}/5` : "N/A", icon: Star, color: "text-warning" },
    { label: "Total Earnings", value: `$${profile?.total_earnings ?? 0}`, icon: DollarSign, color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="stat-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold mt-2">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription card */}
      <Card className="dark-card border-primary/30">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="font-bold text-lg capitalize">{subscription?.tier ?? "Free"}</p>
              {subscription?.current_period_end && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <Link href="/pricing">
              <Button size="sm" className="gold-gradient text-black font-semibold">
                {subscription?.tier === "enterprise" ? "Manage Plan" : "Upgrade"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployerJobsTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/jobs/employer/mine"] });
  const jobs = data?.jobs ?? [];

  if (isLoading) return <div className="space-y-3">{Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Your Job Postings ({jobs.length})</h2>
        <Link href="/post-job"><Button size="sm" className="gold-gradient text-black"><Plus className="h-4 w-4 mr-1" />Post New Job</Button></Link>
      </div>
      {jobs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No jobs yet. Post your first job to find Web3 talent.</p>
          <Link href="/post-job"><Button size="sm" className="mt-4 gold-gradient text-black">Post a Job</Button></Link>
        </div>
      ) : (
        jobs.map((job: any) => (
          <Card key={job.id} className="dark-card" data-testid={`card-employer-job-${job.id}`}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="font-medium">{job.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-xs ${job.status === "active" ? "border-success text-success" : "border-border"}`}>{job.status}</Badge>
                  <span className="text-xs text-muted-foreground">{job.proposal_count} proposals · {new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Link href={`/jobs/${job.id}/proposals`}><Button size="sm" variant="outline">View Proposals</Button></Link>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function FreelancerProposalsTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/proposals/mine"] });
  const proposals = data?.proposals ?? [];

  const statusIcon = (s: string) => {
    if (s === "accepted") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (s === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  if (isLoading) return <div className="space-y-3">{Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold mb-4">My Proposals ({proposals.length})</h2>
      {proposals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No proposals yet. Browse jobs and start applying.</p>
          <Link href="/jobs"><Button size="sm" className="mt-4 gold-gradient text-black">Browse Jobs</Button></Link>
        </div>
      ) : (
        proposals.map((p: any) => (
          <Card key={p.id} className="dark-card" data-testid={`card-proposal-${p.id}`}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {statusIcon(p.status)}
                <div>
                  <p className="font-medium text-sm">{p.jobs?.title ?? "Job"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Bid: ${p.bid_amount} · {p.delivery_days} days · {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant="outline" className="capitalize text-xs shrink-0">{p.status}</Badge>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function PaymentsTab() {
  const { subscription } = useAuth();
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/payments/history"] });
  const payments = data?.payments ?? [];

  return (
    <div className="space-y-6">
      {/* Current subscription */}
      <Card className="dark-card border-primary/30">
        <CardHeader className="pb-2"><CardTitle className="text-base">Subscription</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge className={`badge-tier-${subscription?.tier ?? "free"} text-sm px-3 py-1`}>{(subscription?.tier ?? "free").toUpperCase()}</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {subscription?.proposals_left && subscription.proposals_left < 9999 ? `${subscription.proposals_left} proposals remaining` : "Unlimited proposals"}
              </p>
            </div>
            <Link href="/pricing"><Button size="sm" className="gold-gradient text-black">Upgrade Plan</Button></Link>
          </div>
        </CardContent>
      </Card>

      {/* Payment history */}
      <div>
        <h2 className="font-semibold mb-3">Payment History</h2>
        {isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : payments.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No payments yet</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p: any) => (
              <Card key={p.id} className="dark-card" data-testid={`card-payment-${p.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.description ?? "Payment"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()} · {p.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${p.amount} {p.currency}</p>
                    <Badge variant={p.status === "completed" ? "default" : "outline"} className={`text-xs ${p.status === "completed" ? "bg-success/20 text-success border-success/30" : ""}`}>{p.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReferralsTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/referrals"] });
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="dark-card border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Your Referral Link</p>
              <p className="text-xs text-muted-foreground">Earn 20% of each referred user's first payment</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input value={data?.referralLink ?? "Loading..."} readOnly className="font-mono text-xs bg-muted" />
            <Button variant="outline" size="icon" onClick={copyLink} data-testid="btn-copy-referral">
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold mb-3">Your Referrals ({data?.referrals?.length ?? 0})</h2>
        {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (data?.referrals?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No referrals yet. Share your link to start earning!</p>
        ) : (
          <div className="space-y-2">
            {data.referrals.map((r: any) => (
              <Card key={r.id} className="dark-card" data-testid={`card-referral-${r.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{r.referred?.display_name ?? "User"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    {r.bonus_paid ? (
                      <p className="text-sm font-semibold text-success">+${r.bonus_amount?.toFixed(2)}</p>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Pending first payment</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/notifications"] });
  const qc = useQueryClient();
  const notifications = data?.notifications ?? [];

  const markAllRead = async () => {
    await apiRequest("PATCH", "/api/notifications/read-all");
    qc.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Notifications</h2>
        {notifications.some((n: any) => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={markAllRead} data-testid="btn-mark-all-read">Mark all read</Button>
        )}
      </div>
      {isLoading ? <div className="space-y-2">{Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        : notifications.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No notifications yet</p>
        : notifications.map((n: any) => (
          <Card key={n.id} className={`dark-card transition-colors ${!n.is_read ? "border-primary/30" : ""}`} data-testid={`notif-${n.id}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <Bell className={`h-4 w-4 mt-0.5 shrink-0 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </CardContent>
          </Card>
        ))
      }
    </div>
  );
}
