import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import momoLogo from "@/assets/momo-logo.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMessage("注册成功！请查收邮件验证您的账号。");
      }
    } catch (err: any) {
      setError(err.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "apple") => {
    setError("");
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message || `${provider} 登录失败`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-xs sm:max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <img src={momoLogo} alt="Momo Editor" className="w-16 h-16 rounded-2xl mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Momo Editor</h1>
          <p className="text-sm text-muted-foreground">优雅的 Markdown 文字卡片生成工具</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuthLogin("google")}
            className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium hover:bg-secondary/60 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            onClick={handleAppleLogin}
            className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium hover:bg-secondary/60 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">或使用邮箱</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="邮箱地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
          />
          <input
            type="password"
            placeholder="密码（至少 6 位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background rounded-xl px-4 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {loading ? "处理中..." : isLogin ? "登录" : "注册"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "还没有账号？" : "已有账号？"}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
            className="text-foreground font-medium ml-1 hover:underline"
          >
            {isLogin ? "注册" : "登录"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
