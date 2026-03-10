import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Plus, X, Eye, Upload, Pipette } from "lucide-react";
import { COLOR_PALETTE, type ColorItem } from "@/lib/colors";

const SAMPLE_PARAGRAPHS = [
  "与其在模型层内卷，不如想想怎么把 Context 喂得更优雅。好的 Prompt 工程就像好的产品设计——看似简单，背后是大量的迭代和取舍。",
  "这段文字用来展示不同颜色在长文本中的视觉效果。一个好的配色方案需要在阅读时既醒目又不刺眼，既有辨识度又保持整体和谐。字体大小、行高、字间距都会影响颜色的最终呈现。",
  "在小红书的图文排版中，颜色的运用至关重要。标题需要醒目，正文需要舒适，强调部分需要恰到好处地吸引注意力。太多颜色会显得杂乱，太少又会单调乏味。",
];

const STORAGE_KEY = "color-playground-selected";
const CUSTOM_COLORS_KEY = "color-playground-custom";
const COMPARE_KEY = "color-playground-compare";

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

const ColorPlayground = () => {
  const [selected, setSelected] = useState<Set<string>>(() =>
    new Set(loadFromStorage<string[]>(STORAGE_KEY, ["#2B4C7E", "#D94F4F", "#2A7A4B", "#7B4EA3", "#C7742E", "#4A5E6D"]))
  );
  const [comparing, setComparing] = useState<Set<string>>(() =>
    new Set(loadFromStorage<string[]>(COMPARE_KEY, []))
  );
  const [customColors, setCustomColors] = useState<ColorItem[]>(() =>
    loadFromStorage(CUSTOM_COLORS_KEY, [])
  );
  const [newColor, setNewColor] = useState("#5A7D9A");
  const [newLabel, setNewLabel] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Eyedropper state
  const [eyedropperImage, setEyedropperImage] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
  }, [selected]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(customColors));
  }, [customColors]);

  useEffect(() => {
    localStorage.setItem(COMPARE_KEY, JSON.stringify([...comparing]));
  }, [comparing]);

  const toggle = (color: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(color)) {
        next.delete(color);
        // Also remove from comparing
        setComparing((cp) => { const n = new Set(cp); n.delete(color); return n; });
      } else {
        next.add(color);
      }
      return next;
    });
  };

  const toggleCompare = (color: string) => {
    setComparing((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  };

  const addCustomColor = () => {
    if (!newColor) return;
    const label = newLabel.trim() || newColor;
    setCustomColors((prev) => [...prev, { label, color: newColor }]);
    setSelected((prev) => new Set([...prev, newColor]));
    setNewLabel("");
    setNewColor("#5A7D9A");
    setShowAddForm(false);
  };

  const removeCustomColor = (color: string) => {
    setCustomColors((prev) => prev.filter((c) => c.color !== color));
    setSelected((prev) => { const n = new Set(prev); n.delete(color); return n; });
    setComparing((prev) => { const n = new Set(prev); n.delete(color); return n; });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEyedropperImage(reader.result as string);
      setPickedColor(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      setPickedColor(hex);
      setNewColor(hex);
    },
    []
  );

  const handleImageLoad = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
  }, []);

  const addPickedColor = () => {
    if (!pickedColor) return;
    const label = newLabel.trim() || pickedColor;
    setCustomColors((prev) => [...prev, { label, color: pickedColor }]);
    setSelected((prev) => new Set([...prev, pickedColor]));
    setPickedColor(null);
    setNewLabel("");
  };

  const allColors = [...Object.values(COLOR_PALETTE).flat(), ...customColors];
  const selectedColors = allColors.filter((c) => selected.has(c.color));
  const compareColors = allColors.filter((c) => comparing.has(c.color));

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🎨 颜色选择器</h1>
            <p className="text-sm text-muted-foreground mt-1">
              点击色块选中/取消 · 已选 {selected.size} 个 · 点击 <Eye className="w-3 h-3 inline" /> 加入对比 · 选择自动保存
            </p>
          </div>
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            ← 返回编辑器
          </a>
        </div>

        {/* Compare preview area */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            对比预览 · 点击已选颜色旁的 👁 图标添加到此处
          </h2>

          {compareColors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              从下方已选颜色中点击 <Eye className="w-3.5 h-3.5 inline" /> 图标，将颜色加入对比
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {compareColors.map((c) => (
                <div key={c.color} className="bg-white rounded-lg p-6 shadow-sm border border-border/50 space-y-3 relative">
                  <button
                    onClick={() => toggleCompare(c.color)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="移出对比"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full" style={{ background: c.color }} />
                    <span className="text-xs font-medium text-muted-foreground">{c.label} {c.color}</span>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: c.color }}>
                    好的排版，是无声的说服力
                  </h3>
                  {SAMPLE_PARAGRAPHS.map((text, i) => (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: c.color }}>
                      {text}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected colors strip with compare toggle */}
        {selectedColors.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              已选颜色（同步到编辑器工具栏）
            </h2>
            <div className="flex gap-3 flex-wrap">
              {selectedColors.map((c) => {
                const isComparing = comparing.has(c.color);
                return (
                  <div key={c.color} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full shadow-sm border-2 border-background"
                      style={{ background: c.color }}
                    />
                    <span className="text-[10px] text-muted-foreground">{c.label}</span>
                    <button
                      onClick={() => toggleCompare(c.color)}
                      className={`transition-colors ${isComparing ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                      title={isComparing ? "移出对比" : "加入对比"}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom color section */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              自定义颜色
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加颜色
            </button>
          </div>

          {showAddForm && (
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-24 px-2 py-1.5 text-sm font-mono rounded-md bg-secondary text-foreground border border-border"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">名称（可选）</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-28 px-2 py-1.5 text-sm rounded-md bg-secondary text-foreground border border-border"
                  placeholder="我的颜色"
                />
              </div>
              <button
                onClick={addCustomColor}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                添加
              </button>
            </div>
          )}

          {customColors.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {customColors.map((c) => (
                <div
                  key={c.color}
                  className="group relative flex items-center gap-2 bg-secondary rounded-lg px-3 py-2"
                >
                  <div className="w-6 h-6 rounded-full" style={{ background: c.color }} />
                  <span className="text-sm">{c.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">{c.color}</span>
                  <button
                    onClick={() => removeCustomColor(c.color)}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">还没有自定义颜色，点击上方「添加颜色」开始</p>
          )}
        </div>

        {/* Color palette categories */}
        {Object.entries(COLOR_PALETTE).map(([category, colors]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {category}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {colors.map((c) => {
                const isSelected = selected.has(c.color);
                return (
                  <button
                    key={c.color}
                    onClick={() => toggle(c.color)}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-foreground bg-card shadow-md"
                        : "border-transparent bg-card/50 hover:bg-card hover:border-border"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-9 h-9 rounded-full shadow-sm"
                        style={{ background: c.color }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-sm font-medium truncate">{c.label}</div>
                      <div className="text-xs text-muted-foreground font-mono">{c.color}</div>
                      <div className="text-xs mt-0.5 leading-snug" style={{ color: c.color }}>
                        好的排版是无声的说服力
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPlayground;
