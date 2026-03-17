import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Clock, DollarSign, Briefcase, Filter, TrendingUp } from "lucide-react";
import type { Job } from "@shared/schema";

const CATEGORIES = ["All", "Smart Contract", "Frontend", "Backend", "DeFi", "NFT", "Security", "Design", "Marketing", "Content", "DevOps", "Mobile"];

function JobCard({ job }: { job: Job }) {
  const since = new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="dark-card hover:border-primary/40 transition-all duration-200 cursor-pointer group" data-testid={`card-job-${job.id}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {job.is_featured && <Badge className="gold-gradient text-black text-[10px] font-semibold">⭐ Featured</Badge>}
                <Badge variant="outline" className="text-xs border-border">{job.category}</Badge>
                <Badge variant="secondary" className="text-xs">{job.experience_level ?? "Mid"}</Badge>
              </div>
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                {job.title}
              </h3>
              <p className="text-muted-foreground text-sm mt-1.5 line-clamp-2">{job.description}</p>

              {job.tags && job.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{tag}</span>
                  ))}
                  {job.tags.length > 4 && <span className="text-[11px] text-muted-foreground">+{job.tags.length - 4} more</span>}
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="font-bold text-primary text-sm">
                {job.budget_min && job.budget_max
                  ? `$${job.budget_min}–$${job.budget_max}`
                  : job.budget_max ? `$${job.budget_max}` : "Negotiable"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{job.budget_currency ?? "USDT"}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{since}</span>
            <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.proposal_count ?? 0} proposals</span>
            {job.deadline && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />
                Due {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category !== "All") params.set("category", category);
  params.set("page", String(page));

  const { data, isLoading } = useQuery<{ jobs: Job[]; total: number }>({
    queryKey: [`/api/jobs?${params}`],
    placeholderData: prev => prev,
  });

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Browse Web3 Jobs</h1>
        <p className="text-muted-foreground text-sm">{total > 0 ? `${total} open positions` : "Find your next Web3 opportunity"}</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, skills, keywords..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            data-testid="input-job-search"
          />
        </div>
        <Select value={category} onValueChange={v => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-category">
            <Filter className="h-4 w-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Link href="/post-job">
          <Button className="gold-gradient text-black font-semibold shrink-0" data-testid="btn-post-job">+ Post a Job</Button>
        </Link>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.slice(1).map(c => (
          <button
            key={c}
            onClick={() => { setCategory(category === c ? "All" : c); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${category === c ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/40"}`}
            data-testid={`chip-category-${c}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Job list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No jobs found</p>
          <p className="text-sm mt-1">Try different search terms or browse all categories</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCategory("All"); }}>Clear filters</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} data-testid="btn-prev-page">← Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} data-testid="btn-next-page">Next →</Button>
        </div>
      )}
    </div>
  );
}
