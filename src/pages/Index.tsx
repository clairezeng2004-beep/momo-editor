import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { marked } from "marked";
import { TEMPLATES, ASPECT_RATIOS, DEFAULT_MARKDOWN } from "@/lib/templates";
import type { TemplateStyle, AspectRatio } from "@/lib/templates";
import { Download, Type, Ratio, Eye, Edit3 } from "lucide-react";

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
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [ratio, setRatio] = useState(ASPECT_RATIOS[0]);
  const [fontSize, setFontSize] = useState(16);
  const [textAlign, setTextAlign] = useState<"justify" | "left" | "center">("justify");
  const [showEditor, setShowEditor] = useState(true);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const cardHeight = (CARD_WIDTH / ratio.width) * ratio.height;

  const getHtml = useCallback(() => {
    return marked.parse(markdown, { async: false }) as string;
  }, [markdown]);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const scale = 3;
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: scale,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `xiaohongshu-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

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

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar controls */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-card overflow-y-auto shrink-0">
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

            {/* Text align */}
            <section>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Type className="w-3.5 h-3.5" /> 对齐
              </h2>
              <div className="flex gap-1.5">
                {([["justify", "两端对齐"], ["left", "左对齐"], ["center", "居中"]] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTextAlign(value)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                      textAlign === value
                        ? "bg-foreground text-background font-medium"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

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
            <div className="p-5">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Edit3 className="w-3.5 h-3.5" /> Markdown 编辑
              </h2>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full h-64 lg:h-80 bg-secondary rounded-lg p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20 text-foreground placeholder:text-muted-foreground"
                placeholder="在此输入 Markdown 内容..."
              />
            </div>
          </div>
        </aside>

        {/* Preview area */}
        <main className="flex-1 overflow-auto flex items-start justify-center p-6 lg:p-10 bg-background">
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground">
              预览 · {ratio.label} · {CARD_WIDTH}×{Math.round(cardHeight)}
            </p>
            <div
              ref={cardRef}
              className={`${template.className} shadow-2xl`}
              style={{
                width: CARD_WIDTH,
                minHeight: cardHeight,
                fontFamily: '"Noto Sans SC", system-ui, -apple-system, sans-serif',
                fontSize: `${fontSize}px`,
                padding: `${fontSize * 2.2}px ${fontSize * 1.8}px`,
                borderRadius: 0,
                boxSizing: "border-box",
                textAlign: textAlign,
              }}
            >
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: getHtml() }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
