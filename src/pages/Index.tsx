import { useRef, useState, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { marked } from "marked";
import { TEMPLATES, ASPECT_RATIOS, DEFAULT_MARKDOWN } from "@/lib/templates";
import type { TemplateStyle, AspectRatio } from "@/lib/templates";
import { Download, Type, Ratio, Eye, Edit3, Undo2, Redo2, Plus, FileText, Trash2, ChevronDown, Palette, Pencil, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import FormatToolbar from "@/components/FormatToolbar";
import FloatingToolbar from "@/components/FloatingToolbar";
import PaginatedPreview from "@/components/PaginatedPreview";
import TemplateEditor from "@/components/TemplateEditor";
import { useHistory } from "@/hooks/use-history";
import { useDrafts } from "@/hooks/use-drafts";
import { useCustomTemplates } from "@/hooks/use-custom-templates";
import type { CustomTemplate } from "@/hooks/use-custom-templates";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const CARD_WIDTH = 420;

// Extracted outside Index to prevent remount on every render
const CollapsibleSection = ({
  id,
  icon: Icon,
  label,
  collapsed,
  onToggle,
  children,
}: {
  id: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) => (
  <section>
    <button
      onClick={() => onToggle(id)}
      className="w-full text-[13px] font-medium mb-3 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
    >
      <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`} />
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
    <div className={`transition-all duration-200 ${collapsed ? "hidden" : ""}`}>
      {children}
    </div>
  </section>
);

const TemplateSelector = ({
  selected,
  onSelect,
  allTemplates,
  onCreateNew,
  onEdit,
  onDelete,
}: {
  selected: TemplateStyle;
  onSelect: (t: TemplateStyle) => void;
  allTemplates: TemplateStyle[];
  onCreateNew: () => void;
  onEdit: (t: CustomTemplate) => void;
  onDelete: (id: string) => void;
}) => (
  <div className="flex gap-2.5 flex-wrap">
    {allTemplates.map((t) => {
      const isCustom = "isCustom" in t;
      return (
        <div key={t.id} className="relative group">
          <button
            onClick={() => onSelect(t)}
            className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all border ${
              selected.id === t.id
                ? "border-foreground/40 bg-secondary/60 shadow-sm"
                : "border-transparent hover:bg-secondary/40"
            }`}
          >
            <div
              className="w-10 h-14 rounded-lg shadow-sm border border-border/60"
              style={{ background: t.previewBg }}
            >
              <div className="mt-2.5 mx-auto w-5 h-0.5 rounded-full" style={{ background: t.previewText }} />
              <div className="mt-1 mx-auto w-6 h-0.5 rounded-full opacity-40" style={{ background: t.previewText }} />
              <div className="mt-1 mx-auto w-4 h-0.5 rounded-full opacity-40" style={{ background: t.previewText }} />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">{t.name}</span>
          </button>
          {isCustom && (
            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(t as CustomTemplate); }}
                className="w-5 h-5 rounded-full bg-card border border-border shadow flex items-center justify-center hover:bg-secondary"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                className="w-5 h-5 rounded-full bg-card border border-border shadow flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
      );
    })}
    <button
      onClick={onCreateNew}
      className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all border border-dashed border-border/60 hover:bg-secondary/30"
    >
      <div className="w-10 h-14 rounded-lg border border-dashed border-border/60 flex items-center justify-center">
        <Plus className="w-4 h-4 text-muted-foreground" />
      </div>
      <span className="text-[11px] text-muted-foreground font-medium">自定义</span>
    </button>
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
        className={`px-3.5 py-1.5 rounded-full text-[13px] transition-all ${
          selected.id === r.id
            ? "bg-foreground text-background font-medium shadow-sm"
            : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
        }`}
      >
        {r.label}
      </button>
    ))}
  </div>
);

const Index = () => {
  const drafts = useDrafts(DEFAULT_MARKDOWN);
  const customTemplates = useCustomTemplates();
  const [showDraftList, setShowDraftList] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const draftDropdownRef = useRef<HTMLDivElement>(null);

  // Close draft dropdown on click outside
  useEffect(() => {
    if (!showDraftList) return;
    const handler = (e: MouseEvent) => {
      if (draftDropdownRef.current && !draftDropdownRef.current.contains(e.target as Node)) {
        setShowDraftList(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDraftList]);

  // Initialize: load current draft or create one
  useEffect(() => {
    if (drafts.drafts.length === 0) {
      drafts.createDraft();
    } else if (!drafts.currentDraftId) {
      drafts.switchDraft(drafts.drafts[0].id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentDraft = drafts.getCurrentDraft();
  const history = useHistory(currentDraft?.markdown ?? DEFAULT_MARKDOWN);
  const markdown = history.value;
  const [template, setTemplate] = useState(() =>
    TEMPLATES.find((t) => t.id === currentDraft?.templateId) ?? TEMPLATES[0]
  );
  const [ratio, setRatio] = useState(() =>
    ASPECT_RATIOS.find((r) => r.id === currentDraft?.ratioId) ?? ASPECT_RATIOS[0]
  );
  const [fontSize, setFontSize] = useState(currentDraft?.fontSize ?? 15);
  const [textAlign] = useState<"justify" | "left" | "center">("justify");
  const [showEditor, setShowEditor] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [directHtml, setDirectHtml] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When switching drafts, reload state
  const prevDraftIdRef = useRef(drafts.currentDraftId);
  useEffect(() => {
    if (drafts.currentDraftId && drafts.currentDraftId !== prevDraftIdRef.current) {
      const d = drafts.getCurrentDraft();
      if (d) {
        history.reset(d.markdown);
        setTemplate(TEMPLATES.find((t) => t.id === d.templateId) ?? TEMPLATES[0]);
        setRatio(ASPECT_RATIOS.find((r) => r.id === d.ratioId) ?? ASPECT_RATIOS[0]);
        setFontSize(d.fontSize);
        setDirectHtml(null);
      }
    }
    prevDraftIdRef.current = drafts.currentDraftId;
  }, [drafts.currentDraftId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save draft on changes (debounced)
  useEffect(() => {
    if (!drafts.currentDraftId) return;
    const timer = setTimeout(() => {
      drafts.updateDraft(markdown, template.id, ratio.id, fontSize);
    }, 500);
    return () => clearTimeout(timer);
  }, [markdown, template.id, ratio.id, fontSize, drafts.currentDraftId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [markdown]);

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

  // Convert HTML back to simple markdown
  const htmlToMarkdown = useCallback((html: string): string => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const lines: string[] = [];
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const el = node as HTMLElement;
      const tag = el.tagName;
      const inner = Array.from(el.childNodes).map(processNode).join("");
      switch (tag) {
        case "H1": return `# ${inner}`;
        case "H2": return `## ${inner}`;
        case "H3": return `### ${inner}`;
        case "H4": return `#### ${inner}`;
        case "BLOCKQUOTE": return `> ${inner}`;
        case "STRONG": case "B": return `**${inner}**`;
        case "EM": case "I": return `*${inner}*`;
        case "BR": return "\n";
        case "P": case "DIV": return inner;
        case "UL": return Array.from(el.children).map(li => `- ${processNode(li)}`).join("\n");
        case "OL": return Array.from(el.children).map((li, i) => `${i + 1}. ${processNode(li)}`).join("\n");
        case "LI": return inner;
        case "HR": return "---";
        case "CODE":
          if (el.parentElement?.tagName === "PRE") return inner;
          return `\`${inner}\``;
        case "PRE": return `\`\`\`\n${inner}\n\`\`\``;
        default: return inner;
      }
    };
    Array.from(div.childNodes).forEach((node) => {
      lines.push(processNode(node));
    });
    return lines.join("\n");
  }, []);

  // When preview is directly edited
  const handleContentChange = useCallback(() => {
    if (contentRef.current) {
      const currentHtml = contentRef.current.innerHTML;
      setDirectHtml(currentHtml);
      // Sync back to markdown
      const md = htmlToMarkdown(currentHtml);
      history.push(md);
    }
  }, [htmlToMarkdown, history]);

  // Keyboard shortcuts for undo/redo and bold
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
      // Ctrl+B / Cmd+B for bold
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        const ta = textareaRef.current;
        // If focus is inside the preview (contentEditable), use execCommand
        const activeEl = document.activeElement;
        if (activeEl && activeEl.getAttribute("contenteditable") === "true") {
          document.execCommand("bold");
          handleContentChange();
          return;
        }
        // If focus is in textarea, wrap selection with **
        if (ta && document.activeElement === ta) {
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          if (start !== end) {
            const selected = markdown.slice(start, end);
            const newText = markdown.slice(0, start) + "**" + selected + "**" + markdown.slice(end);
            handleMarkdownChange(newText);
            requestAnimationFrame(() => {
              ta.focus();
              ta.setSelectionRange(start + 2, end + 2);
            });
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [history, markdown, handleMarkdownChange, handleContentChange]);

  const handleExport = async () => {
    // Export all page cards
    const pageElements = document.querySelectorAll('[data-page-index]');
    if (pageElements.length === 0) return;
    setExporting(true);
    try {
      const scale = 3;
      for (let i = 0; i < pageElements.length; i++) {
        const el = pageElements[i] as HTMLElement;
        // Warmup pass to ensure fonts/images are loaded
        await toPng(el, { pixelRatio: 1, cacheBust: true });
        await new Promise(r => setTimeout(r, 100));
        const dataUrl = await toPng(el, {
          pixelRatio: scale,
          cacheBust: true,
        });
        const link = document.createElement("a");
        link.download = `xiaohongshu-${Date.now()}-${i + 1}.png`;
        link.href = dataUrl;
        link.click();
        // Small delay between downloads
        if (pageElements.length > 1) await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const renderedHtml = directHtml ?? getHtml();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({ editor: false });
  const toggleSection = (key: string) => setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));


  const sidebarContent = (
    <>
      <div className="p-5 space-y-5">
        <CollapsibleSection id="style" icon={Eye} label="样式" collapsed={collapsedSections["style"] ?? false} onToggle={toggleSection}>
          <TemplateSelector
            selected={template}
            onSelect={(t) => {
              setTemplate(t);
              if ("isCustom" in t) {
                setFontSize((t as CustomTemplate).defaultFontSize);
              }
            }}
            allTemplates={[...TEMPLATES, ...customTemplates.templates]}
            onCreateNew={() => { setEditingTemplate(null); setShowTemplateEditor(true); }}
            onEdit={(t) => { setEditingTemplate(t); setShowTemplateEditor(true); }}
            onDelete={(id) => {
              customTemplates.deleteTemplate(id);
              if (template.id === id) setTemplate(TEMPLATES[0]);
            }}
          />
        </CollapsibleSection>

        <CollapsibleSection id="ratio" icon={Ratio} label="比例" collapsed={collapsedSections["ratio"] ?? false} onToggle={toggleSection}>
          <RatioSelector selected={ratio} onSelect={setRatio} />
        </CollapsibleSection>

        <CollapsibleSection id="font" icon={Type} label={`字号 · ${fontSize}px`} collapsed={collapsedSections["font"] ?? false} onToggle={toggleSection}>
          <input
            type="range"
            min={12}
            max={24}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-foreground h-1 appearance-none bg-border rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </CollapsibleSection>

        {/* Toggle editor on mobile */}
        <button
          onClick={() => setShowEditor(!showEditor)}
          className="lg:hidden w-full flex items-center justify-center gap-2 bg-secondary/60 text-secondary-foreground px-4 py-2.5 rounded-xl text-[13px] font-medium hover:bg-secondary transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          {showEditor ? "隐藏编辑器" : "显示编辑器"}
        </button>
      </div>

      {/* Editor */}
      <div className={`${showEditor ? "block" : "hidden"} lg:block border-t border-border/60`}>
        <div className="p-5 space-y-4">
          <CollapsibleSection id="editor" icon={Edit3} label="编辑" collapsed={collapsedSections["editor"] ?? false} onToggle={toggleSection}>
            <div className="flex items-center justify-end gap-0.5 mb-2">
              <button
                onClick={() => { history.undo(); setDirectHtml(null); }}
                disabled={!history.canUndo}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                title="撤销 (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { history.redo(); setDirectHtml(null); }}
                disabled={!history.canRedo}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                title="重做 (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <FormatToolbar
              textareaRef={textareaRef}
              markdown={markdown}
              onChange={handleMarkdownChange}
            />
            <div className="mt-3">
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => {
                handleMarkdownChange(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }}
              className="w-full min-h-[120px] bg-background border border-border/60 rounded-xl p-4 text-[15px] leading-relaxed font-sans resize-none focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 text-foreground placeholder:text-muted-foreground/60 transition-all"
              placeholder="在此输入内容，直接换行即可分段..."
              style={{ overflow: 'hidden', height: 'auto' }}
            />
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </>
  );

  const isMobile = useIsMobile();
  const mobileScale = isMobile ? Math.min(1, (window.innerWidth - 48) / CARD_WIDTH) : 1;

  const previewContent = (
    <div className="flex-1 overflow-auto flex flex-col items-center bg-background/80 relative">
      {/* Fixed toolbar above preview - stays at top of scroll container */}
      <div className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-sm py-2 px-4 lg:px-10 flex justify-center">
        <div className="w-full max-w-lg">
          <FloatingToolbar
            containerRef={contentRef}
            onContentChange={handleContentChange}
          />
        </div>
      </div>
      <div className="px-4 lg:px-10 w-full flex flex-col items-center">
      <p className="text-[11px] text-muted-foreground/70 text-center font-medium tracking-wide mb-4 mt-2">
        {ratio.label} · {CARD_WIDTH}×{Math.round(cardHeight)}
        <span className="ml-2 hidden sm:inline">选中文字使用上方工具栏</span>
      </p>
      <div style={isMobile ? { transform: `scale(${mobileScale})`, transformOrigin: 'top center' } : undefined}>
        <PaginatedPreview
          html={renderedHtml}
          cardWidth={CARD_WIDTH}
          cardHeight={cardHeight}
          fontSize={fontSize}
          textAlign={textAlign}
          templateClassName={template.className}
          templateBackground={template.background}
          onContentChange={handleContentChange}
          contentRef={contentRef}
          directHtml={directHtml}
          markdown={markdown}
        />
      </div>
    </div>
  );

  // Generate dynamic CSS for custom templates
  const customTemplateStyles = customTemplates.templates.map((ct) => `
    .${ct.className} { background: ${ct.background}; color: ${ct.textColor}; }
    .${ct.className} .markdown-body h1, .${ct.className} .markdown-body h2 { color: ${ct.headingColor}; }
  `).join("\n");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{customTemplateStyles}</style>
      <TemplateEditor
        open={showTemplateEditor}
        onClose={() => { setShowTemplateEditor(false); setEditingTemplate(null); }}
        onSave={(t) => {
          customTemplates.addTemplate(t);
          setTemplate(t);
          setFontSize(t.defaultFontSize);
        }}
        onUpdate={(id, updates) => {
          customTemplates.updateTemplate(id, updates);
          if (template.id === id) {
            setTemplate({ ...template, ...updates });
          }
        }}
        editingTemplate={editingTemplate}
      />
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl px-5 py-2.5 flex items-center justify-between shrink-0 relative z-[200]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-foreground/90 flex items-center justify-center">
            <Type className="w-3.5 h-3.5 text-background" />
          </div>
          <h1 className="text-[15px] font-semibold tracking-tight hidden sm:block text-foreground/90">CardNote</h1>
          {/* Draft selector */}
          <div className="relative" ref={draftDropdownRef}>
            <button
              onClick={() => setShowDraftList(!showDraftList)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-[13px] hover:bg-secondary/80 transition-colors max-w-[560px]"
            >
              <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{currentDraft?.title ?? "未命名"}</span>
              <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
            </button>
            {showDraftList && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-lg shadow-black/5 z-[100] max-h-80 overflow-y-auto">
                <div className="p-1.5 border-b border-border/40">
                  <button
                    onClick={() => {
                      drafts.createDraft();
                      setShowDraftList(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] hover:bg-secondary/60 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新建草稿
                  </button>
                </div>
                <div className="p-1">
                  {drafts.drafts.map((d) => (
                    <div
                      key={d.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] cursor-pointer group transition-colors ${
                        d.id === drafts.currentDraftId ? "bg-secondary/60 font-medium" : "hover:bg-secondary/40"
                      }`}
                      onClick={() => {
                        drafts.switchDraft(d.id);
                        setShowDraftList(false);
                      }}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{d.title}</div>
                        <div className="text-[10px] text-muted-foreground/70">
                          {new Date(d.updatedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      {drafts.drafts.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            drafts.deleteDraft(d.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-xl text-[13px] font-medium hover:bg-foreground transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? "导出中..." : "导出图片"}
        </button>
      </header>

      {/* Main - Desktop uses resizable panels */}
      <div className="flex-1 flex flex-col lg:hidden overflow-hidden">
        <aside className="w-full border-b border-border/50 bg-card/60 overflow-y-auto shrink-0 max-h-[50vh]">
          {sidebarContent}
        </aside>
        <div className="flex-1 overflow-y-auto">
          {previewContent}
        </div>
      </div>

      <div className="flex-1 hidden lg:flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <aside className="h-full overflow-y-auto bg-card/60">
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
