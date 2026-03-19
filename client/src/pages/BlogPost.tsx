import { Link, useRoute } from "wouter";
import { blogPosts } from "@/data/blogPosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Share2, Twitter, Linkedin, Copy, BookOpen } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// ─── Markdown-ish renderer ───────────────────────────────────────────────────
function renderContent(content: string) {
  const lines = content.trim().split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="text-3xl font-bold mt-8 mb-4 text-foreground leading-tight">
          {line.slice(2)}
        </h1>
      );
      i++; continue;
    }
    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-xl font-bold mt-8 mb-3 text-foreground pb-2 border-b border-border">
          {line.slice(3)}
        </h2>
      );
      i++; continue;
    }
    // H3
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-lg font-semibold mt-6 mb-2 text-foreground">
          {line.slice(4)}
        </h3>
      );
      i++; continue;
    }
    // HR
    if (line.trim() === "---") {
      elements.push(<hr key={key++} className="border-border my-8" />);
      i++; continue;
    }
    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={key++} className="my-5 rounded-xl overflow-hidden border border-border">
          {lang && (
            <div className="bg-secondary/80 px-4 py-2 text-xs text-muted-foreground font-mono border-b border-border">
              {lang}
            </div>
          )}
          <pre className="bg-secondary/40 p-4 overflow-x-auto text-sm font-mono text-foreground/90 leading-relaxed">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>
      );
      i++; continue;
    }
    // Table
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split("|").filter(Boolean).map(h => h.trim());
      const rows = tableLines.slice(2).map(row =>
        row.split("|").filter(Boolean).map(c => c.trim())
      );
      elements.push(
        <div key={key++} className="my-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60">
                {headers.map((h, idx) => (
                  <th key={idx} className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ridx) => (
                <tr key={ridx} className="border-b border-border/50 hover:bg-secondary/20">
                  {row.map((cell, cidx) => (
                    <td key={cidx} className="px-4 py-2.5 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={key++} className="my-5 border-l-4 border-primary/60 pl-5 py-1 bg-primary/5 rounded-r-lg">
          {quoteLines.map((ql, qi) => (
            <p key={qi} className="text-muted-foreground italic text-sm leading-relaxed">{ql}</p>
          ))}
        </blockquote>
      );
      continue;
    }
    // Bullet list
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} className="my-4 space-y-1.5 ml-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-muted-foreground">
              <span className="text-primary mt-1.5 shrink-0">▸</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={key++} className="my-4 space-y-1.5 ml-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-muted-foreground">
              <span className="text-primary font-mono text-sm mt-0.5 shrink-0 w-5">{idx + 1}.</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    }
    // Empty line
    if (line.trim() === "") {
      i++; continue;
    }
    // Paragraph
    elements.push(
      <p key={key++} className="text-muted-foreground leading-relaxed my-3"
        dangerouslySetInnerHTML={{ __html: formatInline(line) }}
      />
    );
    i++;
  }
  return elements;
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-primary">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');
}

// ─── Related posts ───────────────────────────────────────────────────────────
function RelatedPosts({ current }: { current: string }) {
  const related = blogPosts
    .filter(p => p.slug !== current)
    .slice(0, 3);

  return (
    <div className="mt-16">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
        <BookOpen size={18} className="text-primary" />
        More Articles
      </h3>
      <div className="grid sm:grid-cols-3 gap-4">
        {related.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer group">
              <span className="text-2xl block mb-2">{post.coverEmoji}</span>
              <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Clock size={11} /> {post.readTime} min read
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main BlogPost page ──────────────────────────────────────────────────────
export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const post = blogPosts.find(p => p.slug === params?.slug);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">📄</p>
        <h1 className="text-2xl font-bold mb-2">Article not found</h1>
        <p className="text-muted-foreground mb-6">This article doesn't exist or has been moved.</p>
        <Link href="/blog">
          <Button variant="outline">← Back to Blog</Button>
        </Link>
      </div>
    );
  }

  const shareUrl = `https://web3work.up.railway.app/#/blog/${post.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your network." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      {/* Back */}
      <Link href="/blog">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          All articles
        </button>
      </Link>

      {/* Hero */}
      <div className={`rounded-2xl bg-gradient-to-br ${post.coverGradient} bg-card border border-border p-8 mb-8`}>
        <span className="text-5xl block mb-4">{post.coverEmoji}</span>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="border-primary/40 text-primary text-xs capitalize">{post.category}</Badge>
          {post.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
          ))}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">{post.title}</h1>
        <p className="text-muted-foreground text-base leading-relaxed">{post.excerpt}</p>
      </div>

      {/* Meta bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{post.author.avatar}</span>
            <div>
              <p className="text-sm font-medium">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">{post.author.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock size={14} />
            {post.readTime} min read
          </div>
          <span className="text-sm text-muted-foreground">
            {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Share */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Share2 size={13} /> Share:
          </span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}&hashtags=Web3,Web3Work`}
            target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-[#1DA1F2]"
          >
            <Twitter size={15} />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-[#0A66C2]"
          >
            <Linkedin size={15} />
          </a>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-primary"
          >
            <Copy size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <article className="prose-custom">
        {renderContent(post.content)}
      </article>

      {/* Tags */}
      <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-2">
        {post.tags.map(tag => (
          <span key={tag} className="text-xs bg-secondary text-muted-foreground px-3 py-1 rounded-full hover:text-foreground cursor-pointer transition-colors">
            #{tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-6 text-center">
        <p className="font-bold text-lg mb-1">Ready to find Web3 work?</p>
        <p className="text-muted-foreground text-sm mb-4">0% fees. Crypto payments. Built for Web3 talent.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/jobs">
            <Button size="sm">Browse Jobs</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="sm">Create Profile</Button>
          </Link>
        </div>
      </div>

      {/* Related */}
      <RelatedPosts current={post.slug} />
    </div>
  );
}
