import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Lock, Sparkles, Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back, Shraddha.");
      navigate(from, { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="login-page"
      className="min-h-[80vh] flex items-center justify-center px-6 py-16"
    >
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-10 w-fit mx-auto">
          <span className="w-9 h-9 rounded-full bg-[#BC472A] text-[#FAF8F5] flex items-center justify-center">
            <Sparkles size={16} strokeWidth={1.5} />
          </span>
          <span className="serif text-2xl">
            Astro <span className="text-[#BC472A]">Shraddha</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-[#E5DCD3] bg-white p-8 lg:p-10 shadow-[0_8px_30px_rgba(45,40,37,0.06)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-full bg-[#F4EFE7] text-[#BC472A] flex items-center justify-center">
              <Lock size={18} strokeWidth={1.5} />
            </span>
            <div>
              <p className="overline">Private</p>
              <h1 className="serif text-2xl leading-tight">Astrologer sign in</h1>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="overline">Email</Label>
              <Input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 rounded-xl h-12"
                placeholder="astro.shraddhamohole@gmail.com"
                autoComplete="email"
                autoFocus
              />
            </div>
            <div>
              <Label className="overline">Password</Label>
              <Input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 rounded-xl h-12"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              data-testid="login-submit"
              type="submit"
              disabled={busy}
              className="btn-pill w-full bg-[#BC472A] hover:bg-[#A03C23] disabled:opacity-60 text-[#FAF8F5] px-7 py-3.5 text-sm tracking-wide inline-flex items-center justify-center gap-2 transition-colors"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowUpRight size={16} strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-[#6E6864] mt-6 leading-relaxed text-center">
            This area is for the astrologer only. Visitors should use the{" "}
            <Link to="/contact" className="text-[#BC472A]">contact page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
