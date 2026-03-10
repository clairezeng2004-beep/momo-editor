import { useState, useRef, useCallback } from "react";
import { Upload, Plus, Save, X, Pipette } from "lucide-react";
import type { CustomTemplate } from "@/hooks/use-custom-templates";

interface TemplateEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: CustomTemplate) => void;
  onUpdate?: (id: string, template: Partial<CustomTemplate>) => void;
  editingTemplate?: CustomTemplate | null;
}

function extractDominantColors(imageData: ImageData, count = 5): string[] {
  const pixels = imageData.data;
  const colorMap: Record<string, number> = {};

  for (let i = 0; i < pixels.length; i += 16) {
    const r = Math.round(pixels[i] / 32) * 32;
    const g = Math.round(pixels[i + 1] / 32) * 32;
    const b = Math.round(pixels[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }

  return Object.entries(colorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => {
      const [r, g, b] = key.split(",").map(Number);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    });
}

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const TemplateEditor = ({ open, onClose, onSave, onUpdate, editingTemplate }: TemplateEditorProps) => {
  const [name, setName] = useState(editingTemplate?.name ?? "");
  const [bgColor, setBgColor] = useState(editingTemplate?.background ?? "#ffffff");
  const [textColor, setTextColor] = useState(editingTemplate?.textColor ?? "#555555");
  const [headingColor, setHeadingColor] = useState(editingTemplate?.headingColor ?? "#3d3d3d");
  const [defaultFontSize, setDefaultFontSize] = useState(editingTemplate?.defaultFontSize ?? 15);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = extractDominantColors(imageData, 8);
        setExtractedColors(colors);
        setImagePreview(reader.result as string);

        // Auto-assign: lightest → bg, darkest → heading, mid → text
        const sorted = [...colors].sort((a, b) => getLuminance(b) - getLuminance(a));
        setBgColor(sorted[0]);
        setHeadingColor(sorted[sorted.length - 1]);
        setTextColor(sorted[Math.floor(sorted.length / 2)] ?? sorted[1]);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = () => {
    const id = editingTemplate?.id ?? `custom-${Date.now()}`;
    const template: CustomTemplate = {
      id,
      name: name || "自定义样式",
      className: `template-custom-${id}`,
      previewBg: bgColor,
      previewText: textColor,
      background: bgColor,
      isCustom: true,
      textColor,
      headingColor,
      defaultFontSize,
    };

    if (editingTemplate && onUpdate) {
      onUpdate(editingTemplate.id, template);
    } else {
      onSave(template);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold">
            {editingTemplate ? "编辑样式" : "创建自定义样式"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Image upload */}
          <section>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              从图片提取配色
            </label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs">点击上传图片自动提取配色</span>
            </button>
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="mt-2 rounded-lg max-h-24 mx-auto" />
            )}
            {extractedColors.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1.5">提取的颜色（点击应用）</p>
                <div className="flex gap-1.5 flex-wrap">
                  {extractedColors.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <button
                        className="w-7 h-7 rounded-md border border-border shadow-sm hover:scale-110 transition-transform"
                        style={{ background: c }}
                        title={`点击设为背景色，Shift+点击设为文字色`}
                        onClick={(e) => {
                          if (e.shiftKey) setTextColor(c);
                          else setBgColor(c);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setHeadingColor(c);
                        }}
                      />
                      <span className="text-[8px] text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  点击→背景 · Shift+点击→正文 · 右键→标题
                </p>
              </div>
            )}
          </section>

          <canvas ref={canvasRef} className="hidden" />

          {/* Name */}
          <section>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              样式名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="自定义样式"
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </section>

          {/* Colors */}
          <section className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              配色设置
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">背景色</span>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 bg-secondary rounded px-2 py-1 text-xs font-mono min-w-0" />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">正文色</span>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 bg-secondary rounded px-2 py-1 text-xs font-mono min-w-0" />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">标题色</span>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={headingColor} onChange={(e) => setHeadingColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <input type="text" value={headingColor} onChange={(e) => setHeadingColor(e.target.value)}
                    className="flex-1 bg-secondary rounded px-2 py-1 text-xs font-mono min-w-0" />
                </div>
              </div>
            </div>
          </section>

          {/* Font size */}
          <section>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              默认字号 ({defaultFontSize}px)
            </label>
            <input
              type="range"
              min={12}
              max={24}
              value={defaultFontSize}
              onChange={(e) => setDefaultFontSize(Number(e.target.value))}
              className="w-full accent-foreground"
            />
          </section>

          {/* Live preview */}
          <section>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              预览
            </label>
            <div
              className="rounded-lg p-4 border border-border shadow-sm"
              style={{ background: bgColor, fontSize: `${defaultFontSize}px` }}
            >
              <h3 style={{ color: headingColor, fontWeight: 800, fontSize: "1.4em", marginBottom: "0.5em" }}>
                标题预览
              </h3>
              <p style={{ color: textColor, lineHeight: 2 }}>
                这是正文内容预览，用于展示当前配色效果。
                <strong style={{ fontWeight: 700 }}>这是加粗文字</strong>，确认样式是否满意。
              </p>
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg text-sm bg-foreground text-background font-medium hover:opacity-90 flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {editingTemplate ? "保存修改" : "创建样式"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
