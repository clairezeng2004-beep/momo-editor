import { useState, useRef, useEffect } from "react";
import { DEFAULT_MARKDOWN as BUILTIN_DEFAULT } from "@/lib/templates";
import { getDefaultMarkdown, setDefaultMarkdown, resetDefaultMarkdown } from "@/components/DefaultMarkdownEditor";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ADMIN_PASSWORD = "Zzy123456";

const GuidePage = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (authenticated) {
      setValue(getDefaultMarkdown());
    }
  }, [authenticated]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleSave = () => {
    setDefaultMarkdown(value);
    toast.success("默认文本已保存");
  };

  const handleReset = () => {
    setValue(BUILTIN_DEFAULT);
    resetDefaultMarkdown();
    toast.success("已恢复为内置默认文本");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-semibold text-foreground">管理员验证</h1>
            <p className="text-[13px] text-muted-foreground">请输入密码以编辑默认文本</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
            placeholder="请输入管理密码"
            className={`w-full px-4 py-3 rounded-xl border text-[14px] bg-background focus:outline-none focus:ring-2 transition-all ${
              passwordError
                ? "border-destructive focus:ring-destructive/20"
                : "border-border/60 focus:ring-foreground/10 focus:border-foreground/20"
            }`}
            autoFocus
          />
          {passwordError && (
            <p className="text-[12px] text-destructive">密码错误，请重试</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 px-4 py-2.5 rounded-xl text-[13px] text-muted-foreground hover:bg-secondary/60 transition-colors border border-border/60"
            >
              返回
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-foreground/90 text-background text-[13px] font-medium hover:bg-foreground transition-colors"
            >
              确认
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 border-b border-border/50 bg-card/95 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[15px] font-semibold text-foreground/90">编辑默认文本</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            恢复默认
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground/90 text-background text-[13px] font-medium hover:bg-foreground transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            保存
          </button>
        </div>
      </header>
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6">
        <p className="text-[12px] text-muted-foreground mb-4">
          新建草稿时会使用此文本作为初始内容。支持 Markdown 语法。
        </p>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full min-h-[400px] bg-background border border-border/60 rounded-xl p-5 text-[14px] leading-relaxed font-mono resize-none focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 text-foreground placeholder:text-muted-foreground/60 transition-all"
          placeholder="输入 Markdown 内容..."
          style={{ overflow: "hidden" }}
        />
      </div>
    </div>
  );
};

export default GuidePage;
