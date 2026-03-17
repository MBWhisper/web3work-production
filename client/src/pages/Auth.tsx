import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { loginUser, registerUser } from "@/lib/auth";
import { LogoFull } from "@/components/Logo";
import { Eye, EyeOff, Loader2, Briefcase, User } from "lucide-react";
import { Link } from "wouter";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const registerSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["freelancer", "employer"]),
  referralCode: z.string().optional(),
});

export default function AuthPage({ mode = "login" }: { mode?: "login" | "register" }) {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<"freelancer" | "employer">("freelancer");

  // Parse referral code from URL
  const refCode = new URLSearchParams(window.location.search).get("ref") ?? "";
  const roleParam = new URLSearchParams(window.location.search).get("role") as any;

  const loginForm = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const regForm = useForm({ resolver: zodResolver(registerSchema), defaultValues: { displayName: "", email: "", password: "", role: roleParam ?? "freelancer", referralCode: refCode } });

  async function onLogin(values: any) {
    setLoading(true); setError("");
    try {
      const data = await loginUser(values.email, values.password);
      login(data.token, data.user, data.profile, data.subscription);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function onRegister(values: any) {
    setLoading(true); setError("");
    try {
      const data = await registerUser({ ...values, role: activeRole });
      login(data.token, data.user, data.profile, data.subscription);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><LogoFull size={36} /></Link>
          <p className="text-muted-foreground mt-2 text-sm">The Web3 Jobs Marketplace</p>
        </div>

        <Card className="dark-card">
          <Tabs defaultValue={mode}>
            <TabsList className="w-full bg-muted/50 m-4 mb-0" style={{ width: "calc(100% - 2rem)" }}>
              <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-card" data-testid="tab-login">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 data-[state=active]:bg-card" data-testid="tab-register">Create Account</TabsTrigger>
            </TabsList>

            {/* ─── Login ── */}
            <TabsContent value="login">
              <CardHeader>
                <CardTitle className="text-xl">Welcome back</CardTitle>
                <CardDescription>Sign in to your Web3Work account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="you@example.com" {...loginForm.register("email")} data-testid="input-email" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative mt-1.5">
                      <Input id="login-password" type={showPass ? "text" : "password"} placeholder="Your password" {...loginForm.register("password")} data-testid="input-password" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link href="/forgot-password"><span className="text-xs text-primary hover:underline">Forgot password?</span></Link>
                  </div>
                  <Button type="submit" className="w-full gold-gradient text-black font-semibold" disabled={loading} data-testid="btn-submit-login">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            {/* ─── Register ── */}
            <TabsContent value="register">
              <CardHeader>
                <CardTitle className="text-xl">Create your account</CardTitle>
                <CardDescription>Join 12,000+ Web3 professionals. Free to start.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={regForm.handleSubmit(onRegister)} className="space-y-4">
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

                  {/* Role selector */}
                  <div>
                    <Label>I want to...</Label>
                    <div className="grid grid-cols-2 gap-3 mt-1.5">
                      {([["freelancer", "Find Work", User], ["employer", "Hire Talent", Briefcase]] as const).map(([role, label, Icon]) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => { setActiveRole(role); regForm.setValue("role", role); }}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${activeRole === role ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                          data-testid={`btn-role-${role}`}
                        >
                          <Icon className={`h-5 w-5 ${activeRole === role ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Display Name</Label>
                    <Input placeholder="John Doe" {...regForm.register("displayName")} data-testid="input-display-name" className="mt-1.5" />
                    {regForm.formState.errors.displayName && <p className="text-destructive text-xs mt-1">{regForm.formState.errors.displayName.message}</p>}
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="you@example.com" {...regForm.register("email")} data-testid="input-reg-email" className="mt-1.5" />
                    {regForm.formState.errors.email && <p className="text-destructive text-xs mt-1">{regForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <Label>Password</Label>
                    <div className="relative mt-1.5">
                      <Input type={showPass ? "text" : "password"} placeholder="Min 8 characters" {...regForm.register("password")} data-testid="input-reg-password" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {regForm.formState.errors.password && <p className="text-destructive text-xs mt-1">{regForm.formState.errors.password.message}</p>}
                  </div>
                  {refCode && (
                    <div>
                      <Label>Referral Code</Label>
                      <Input {...regForm.register("referralCode")} defaultValue={refCode} className="mt-1.5" readOnly />
                    </div>
                  )}
                  <Button type="submit" className="w-full gold-gradient text-black font-semibold" disabled={loading} data-testid="btn-submit-register">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Free Account"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms"><span className="text-primary hover:underline">Terms of Service</span></Link>
                  </p>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
