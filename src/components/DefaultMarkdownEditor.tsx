import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DEFAULT_MARKDOWN as BUILTIN_DEFAULT } from "@/lib/templates";

const STORAGE_KEY = "card-maker-default-markdown";

export function getDefaultMarkdown(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved;
  } catch {}
  return BUILTIN_DEFAULT;
}

export function setDefaultMarkdown(value: string) {
  localStorage.setItem(STORAGE_KEY, value);
}

export function resetDefaultMarkdown() {
  localStorage.removeItem(STORAGE_KEY);
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (markdown: string) => void;
}

const DefaultMarkdownEditor = ({ open, onClose, onSave }: Props) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setValue(getDefaultMarkdown());
    }
  }, [open]);

  const handleSave = () => {
    setDefaultMarkdown(value);
    onSave(value);
    onClose();
  };

  const handleReset = () => {
    setValue(BUILTIN_DEFAULT);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[15px]">编辑默认文本</DialogTitle>
          <p className="text-[12px] text-muted-foreground">
            新建草稿时会使用此文本作为初始内容
          </p>
        </DialogHeader>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-h-[300px] w-full bg-background border border-border/60 rounded-xl p-4 text-[14px] leading-relaxed font-mono resize-none focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 text-foreground placeholder:text-muted-foreground/60"
          placeholder="输入 Markdown 内容..."
        />
        <DialogFooter className="flex items-center gap-2 sm:justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            恢复默认
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-secondary/60 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-foreground/90 text-background text-[13px] font-medium hover:bg-foreground transition-colors"
            >
              保存
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DefaultMarkdownEditor;
