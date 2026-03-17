import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "./Navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, Briefcase, TrendingUp, CheckCircle2, Clock } from "lucide-react";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated || user?.role !== "admin") return <Navigate to="/" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Web3Work platform overview</p>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="bg-card border border-border mb-6">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="stats"><StatsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="jobs"><JobsAdminTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatsTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/admin/stats"] });

  if (isLoading) return <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length: 6}).map((_,i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  const stats = data?.stats ?? {};
  const statCards = [
    { label: "Total Users", value: stats.total_users ?? 0, icon: Users, color: "text-info" },
    { label: "Active Jobs", value: stats.active_jobs ?? 0, icon: Briefcase, color: "text-success" },
    { label: "Completed Jobs", value: stats.completed_jobs ?? 0, icon: CheckCircle2, color: "text-primary" },
    { label: "Total Revenue", value: `$${parseFloat(stats.total_revenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-warning" },
    { label: "Paid Subscribers", value: stats.paid_subscribers ?? 0, icon: TrendingUp, color: "text-purple-400" },
    { label: "Total Proposals", value: stats.total_proposals ?? 0, icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="stat-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-muted-foreground text-sm">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart placeholder */}
      <Card className="dark-card">
        <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
        <CardContent>
          {data?.revenue?.length > 0 ? (
            <div className="space-y-2">
              {data.revenue.map((r: any) => (
                <div key={r.month} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{r.month}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${Math.min((r.revenue / 1000) * 100, 200)}px` }} />
                    <span className="text-sm font-medium">${parseFloat(r.revenue).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">No revenue data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/admin/users"] });
  const users = data?.users ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">All Users ({data?.total ?? 0})</h2>
      </div>
      {isLoading ? <div className="space-y-2">{Array.from({length: 5}).map((_,i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors" data-testid={`row-user-${u.id}`}>
                    <td className="py-3 px-4">
                      <p className="font-medium">{u.profiles?.display_name ?? u.email.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3 px-4"><Badge variant="outline" className="capitalize text-xs">{u.role}</Badge></td>
                    <td className="py-3 px-4">
                      <Badge className={u.email_verified ? "bg-success/20 text-success border-success/30 text-xs" : "text-xs"} variant="outline">
                        {u.email_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

function JobsAdminTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/admin/jobs"] });
  const jobs = data?.jobs ?? [];

  return (
    <div>
      <h2 className="font-semibold mb-4">All Jobs ({data?.total ?? 0})</h2>
      {isLoading ? <div className="space-y-2">{Array.from({length: 5}).map((_,i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        : (
          <div className="space-y-2">
            {jobs.map((j: any) => (
              <Card key={j.id} className="dark-card" data-testid={`card-admin-job-${j.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{j.title}</p>
                    <p className="text-xs text-muted-foreground">{j.category} · {j.proposal_count} proposals · {new Date(j.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs capitalize ${j.status === "active" ? "border-success text-success" : ""}`}>{j.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      }
    </div>
  );
}
