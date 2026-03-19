import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { blogPosts, BLOG_CATEGORIES, type BlogPost } from "@/data/blogPosts";
import { Search, Clock, ArrowRight, TrendingUp, BookOpen, Zap } from "lucide-react";

// ─── Category pill ──────────────────────────────────────────────────────────
function CategoryPill({
  id, label, active, onClick,
}: { id: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
          : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Featured card (large) ───────────────────────────────────────────────────
function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <div
        className={`relative rounded-2xl border border-border overflow-hidden cursor-pointer
          bg-gradient-to-br ${post.coverGradient} bg-card
          hover:border-primary/40 hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]
          transition-all duration-300 group`}
      >
        {/* Top gradient bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-60" />

        <div className="p-8 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-4xl">{post.coverEmoji}</span>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs uppercase tracking-wider">
              Featured
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">{post.category}</Badge>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
            {post.title}
          </h2>

          <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="text-lg">{post.author.avatar}</span>
                <span>{post.author.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock size={14} />
                <span>{post.readTime} min read</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-primary font-medium text-sm group-hover:gap-2.5 transition-all">
              Read article <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Regular card ────────────────────────────────────────────────────────────
function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <div
        className={`h-full rounded-xl border border-border overflow-hidden cursor-pointer
          bg-card hover:border-primary/30
          hover:shadow-[0_4px_20px_hsl(var(--primary)/0.08)]
          transition-all duration-300 group flex flex-col`}
      >
        {/* Color bar top */}
        <div className={`h-1.5 bg-gradient-to-r ${post.coverGradient} opacity-80`} />

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{post.coverEmoji}</span>
            <Badge variant="secondary" className="text-xs capitalize">{post.category}</Badge>
          </div>

          <h3 className="font-semibold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>

          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>{post.readTime} min</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function StatsBar() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-10">
      {[
        { icon: <BookOpen size={18} />, label: "Articles", value: `${blogPosts.length}+` },
        { icon: <TrendingUp size={18} />, label: "Topics", value: "Web3, DeFi, Careers" },
        { icon: <Zap size={18} />, label: "Updated", value: "Weekly" },
      ].map(s => (
        <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-primary">{s.icon}</span>
          <div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-sm font-medium">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Blog page ──────────────────────────────────────────────────────────
export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return blogPosts.filter(post => {
      const matchCat = activeCategory === "all" || post.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some(t => t.includes(q));
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-3">
          <BookOpen size={16} />
          <span>Web3Work Blog</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Insights for Web3 <span className="text-primary">Builders & Freelancers</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Guides, tutorials, salary data, and industry analysis for the Web3 workforce.
          No noise — only what matters.
        </p>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {BLOG_CATEGORIES.map(cat => (
            <CategoryPill
              key={cat.id}
              id={cat.id}
              label={cat.label}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No articles found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      )}

      {/* Featured */}
      {featured && (
        <div className="mb-8">
          <FeaturedCard post={featured} />
        </div>
      )}

      {/* Grid */}
      {rest.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map(post => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Newsletter CTA */}
      <div className="mt-16 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 text-center">
        <span className="text-3xl mb-3 block">📬</span>
        <h3 className="text-xl font-bold mb-2">The Web3 Work Report</h3>
        <p className="text-muted-foreground mb-5 max-w-md mx-auto text-sm">
          Weekly: top Web3 jobs, salary data, DeFi insights, and freelance tips. Join 500+ builders.
        </p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <Input placeholder="your@email.com" className="bg-secondary border-border" />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
