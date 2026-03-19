import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LogoFull } from "./Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Bell, User, LogOut, Settings, LayoutDashboard, Briefcase, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const TIER_COLORS: Record<string, string> = {
  free: "secondary", basic: "outline", premium: "default", enterprise: "default"
};

export default function Navbar() {
  const [location] = useLocation();
  const { user, profile, subscription, logout, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifData } = useQuery<any>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const unreadCount = notifData?.notifications?.filter((n: any) => !n.is_read).length ?? 0;

  const navLinks = [
    { href: "/jobs", label: "Browse Jobs" },
    { href: "/blog", label: "Blog" },
    { href: "/pricing", label: "Pricing" },
    { href: "/post-job", label: "Post a Job" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <LogoFull size={28} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}>
                <span className={`nav-link ${location === l.href ? "nav-link-active" : ""}`}>
                  {l.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link href="/dashboard/notifications">
                  <Button variant="ghost" size="icon" className="relative" data-testid="btn-notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 h-9 px-3" data-testid="btn-user-menu">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {profile?.display_name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <span className="text-sm font-medium max-w-[120px] truncate">{profile?.display_name}</span>
                      <Badge variant="outline" className={`text-[10px] badge-tier-${subscription?.tier ?? "free"} hidden lg:flex`}>
                        {subscription?.tier ?? "free"}
                      </Badge>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />Dashboard</Link>
                    </DropdownMenuItem>
                    {user?.role === "employer" && (
                      <DropdownMenuItem asChild>
                        <Link href="/post-job"><Briefcase className="h-4 w-4 mr-2" />Post a Job</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile"><User className="h-4 w-4 mr-2" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/billing"><Settings className="h-4 w-4 mr-2" />Billing</Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin"><Settings className="h-4 w-4 mr-2" />Admin Panel</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive" data-testid="btn-logout">
                      <LogOut className="h-4 w-4 mr-2" />Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="btn-login">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="gold-gradient text-black font-semibold hover:opacity-90" data-testid="btn-register">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-border flex flex-col gap-2">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>
                <span className="block py-2 px-3 text-sm font-medium hover:text-primary">{l.label}</span>
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}><span className="block py-2 px-3 text-sm">Dashboard</span></Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="text-left py-2 px-3 text-sm text-destructive">Logout</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}><Button variant="outline" size="sm" className="flex-1">Sign In</Button></Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}><Button size="sm" className="flex-1 gold-gradient text-black">Get Started</Button></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
