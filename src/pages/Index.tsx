import { useRef, useState, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { marked } from "marked";
import { TEMPLATES, ASPECT_RATIOS, DEFAULT_MARKDOWN } from "@/lib/templates";
import type { TemplateStyle, AspectRatio } from "@/lib/templates";
import { Download, Type, Ratio, Eye, Edit3, Undo2, Redo2 } from "lucide-react";
import FormatToolbar from "@/components/FormatToolbar";
import PaginatedPreview from "@/components/PaginatedPreview";
import { useHistory } from "@/hooks/use-history";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const CARD_WIDTH = 420;

const TemplateSelector = ({
  selected,
  onSelect,
}: {
  selected: TemplateStyle;
  onSelect: (t: TemplateStyle) => void;
}) => (
  <div className="flex gap-2 flex-wrap">
    {TEMPLATES.map((t) => (
      <button
        key={t.id}
        onClick={() => onSelect(t)}
        className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-all border-2 ${
          selected.id === t.id
            ? "border-foreground shadow-md scale-105"
            : "border-transparent hover:border-muted-foreground/30"
        }`}
      >
        <div
          className="w-10 h-14 rounded-md shadow-sm border border-border"
          style={{ background: t.previewBg }}
        >
          <div
            className="mt-2 mx-auto w-5 h-0.5 rounded"
            style={{ background: t.previewText }}
          />
          <div
            className="mt-1 mx-auto w-6 h-0.5 rounded opacity-40"
            style={{ background: t.previewText }}
          />
          <div
            className="mt-1 mx-auto w-4 h-0.5 rounded opacity-40"
            style={{ background: t.previewText }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{t.name}</span>
      </button>
    ))}
  </div>
);

const RatioSelector = ({
  selected,
  onSelect,
}: {
  selected: AspectRatio;
  onSelect: (r: AspectRatio) => void;
}) => (
  <div className="flex gap-1.5 flex-wrap">
    {ASPECT_RATIOS.map((r) => (
      <button
        key={r.id}
        onClick={() => onSelect(r)}
        className={`px-3 py-1.5 rounded-md text-sm transition-all ${
          selected.id === r.id
            ? "bg-foreground text-background font-medium"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
      >
        {r.label}
      </button>
    ))}
  </div>
);

const Index = () => {
  const history = useHistory(DEFAULT_MARKDOWN);
  const markdown = history.value;
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [ratio, setRatio] = useState(ASPECT_RATIOS[0]);
  const [fontSize, setFontSize] = useState(16);
  const [textAlign] = useState<"justify" | "left" | "center">("justify");
  const [showEditor, setShowEditor] = useState(true);
  const [exporting, setExporting] = useState(false);
  // When user edits directly in preview, we store overridden HTML
  const [directHtml, setDirectHtml] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cardHeight = (CARD_WIDTH / ratio.width) * ratio.height;

  // Preprocess: single newline → double newline for paragraph breaks
  // But preserve special markdown lines (headings, lists, blockquotes, hr, code fences)
  const preprocessMarkdown = useCallback((text: string) => {
    const lines = text.split('\n');
    const result: string[] = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Track code fences
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        result.push(line);
        continue;
      }

      if (inCodeBlock) {
        result.push(line);
        continue;
      }

      result.push(line);

      // Add extra newline after non-empty lines that are followed by another non-empty line
      // Skip if current or next line is special markdown syntax
      if (i < lines.length - 1) {
        const nextLine = lines[i + 1]?.trim() ?? '';
        const isCurrentEmpty = trimmed === '';
        const isNextEmpty = nextLine === '';
        const isSpecial = (l: string) =>
          l.startsWith('#') || l.startsWith('-') || l.startsWith('*') || l.startsWith('>') ||
          l.startsWith('```') || l.match(/^\d+\./) || l === '---' || l === '***' || l === '';

        if (!isCurrentEmpty && !isNextEmpty && !isSpecial(trimmed) && !isSpecial(nextLine)) {
          result.push('');
        }
      }
    }
    return result.join('\n');
  }, []);

  const getHtml = useCallback(() => {
    const processed = preprocessMarkdown(markdown);
    return marked.parse(processed, { async: false }) as string;
  }, [markdown, preprocessMarkdown]);

  // When markdown changes from textarea, reset directHtml
  const handleMarkdownChange = useCallback(
    (newValue: string) => {
      history.push(newValue);
      setDirectHtml(null);
    },
    [history]
  );

  // When preview is directly edited
  const handleContentChange = useCallback(() => {
    if (contentRef.current) {
      setDirectHtml(contentRef.current.innerHTML);
    }
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          history.redo();
          setDirectHtml(null);
        } else {
          e.preventDefault();
          history.undo();
          setDirectHtml(null);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [history]);

  const handleExport = async () => {
    // Export all page cards
    const pageElements = document.querySelectorAll('[data-page-index]');
    if (pageElements.length === 0) return;
    setExporting(true);
    try {
      const scale = 3;
      for (let i = 0; i < pageElements.length; i++) {
        const el = pageElements[i] as HTMLElement;
        const dataUrl = await toPng(el, {
          pixelRatio: scale,
          cacheBust: true,
        });
        const link = document.createElement("a");
        link.download = `xiaohongshu-${Date.now()}-${i + 1}.png`;
        link.href = dataUrl;
        link.click();
        // Small delay between downloads
        if (pageElements.length > 1) await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const renderedHtml = directHtml ?? getHtml();

  const sidebarContent = (
    <>
      <div className="p-5 space-y-6">
        {/* Template */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" /> 样式
          </h2>
          <TemplateSelector selected={template} onSelect={setTemplate} />
        </section>

        {/* Ratio */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Ratio className="w-3.5 h-3.5" /> 比例
          </h2>
          <RatioSelector selected={ratio} onSelect={setRatio} />
        </section>

        {/* Font size */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Type className="w-3.5 h-3.5" /> 字号 ({fontSize}px)
          </h2>
          <input
            type="range"
            min={12}
            max={24}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-foreground"
          />
        </section>

        {/* Text align - now per-paragraph via floating toolbar */}

        {/* Toggle editor on mobile */}
        <button
          onClick={() => setShowEditor(!showEditor)}
          className="lg:hidden w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Edit3 className="w-4 h-4" />
          {showEditor ? "隐藏编辑器" : "显示编辑器"}
        </button>
      </div>

      {/* Editor */}
      <div className={`${showEditor ? "block" : "hidden"} lg:block border-t border-border`}>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Edit3 className="w-3.5 h-3.5" /> Markdown 编辑
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { history.undo(); setDirectHtml(null); }}
                disabled={!history.canUndo}
                className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="撤销 (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { history.redo(); setDirectHtml(null); }}
                disabled={!history.canRedo}
                className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="重做 (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <FormatToolbar
            textareaRef={textareaRef}
            markdown={markdown}
            onChange={handleMarkdownChange}
          />
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => {
              handleMarkdownChange(e.target.value);
              // Auto-grow
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = `${Math.max(200, el.scrollHeight)}px`;
            }}
            className="w-full min-h-[200px] bg-secondary rounded-lg p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20 text-foreground placeholder:text-muted-foreground"
            placeholder="在此输入内容，直接换行即可分段..."
          />
        </div>
      </div>
    </>
  );

  const previewContent = (
    <div className="flex-1 overflow-auto flex items-start justify-center p-6 lg:p-10 bg-background">
      <div className="flex flex-col items-center gap-4 relative">
        <p className="text-xs text-muted-foreground">
          预览 · {ratio.label} · {CARD_WIDTH}×{Math.round(cardHeight)}
          <span className="ml-2 opacity-60">（可选中文字直接改色/加粗 · 超长自动分页）</span>
        </p>
        <PaginatedPreview
          html={renderedHtml}
          cardWidth={CARD_WIDTH}
          cardHeight={cardHeight}
          fontSize={fontSize}
          textAlign={textAlign}
          templateClassName={template.className}
          onContentChange={handleContentChange}
          contentRef={contentRef}
          directHtml={directHtml}
          markdown={markdown}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Type className="w-4 h-4 text-background" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">文字卡片生成器</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">小红书长图排版</span>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? "导出中..." : "导出图片"}
        </button>
      </header>

      {/* Main - Desktop uses resizable panels */}
      <div className="flex-1 flex flex-col lg:hidden overflow-hidden">
        <aside className="w-full border-b border-border bg-card overflow-y-auto shrink-0">
          {sidebarContent}
        </aside>
        {previewContent}
      </div>

      <div className="flex-1 hidden lg:flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <aside className="h-full overflow-y-auto bg-card">
              {sidebarContent}
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
            {previewContent}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
