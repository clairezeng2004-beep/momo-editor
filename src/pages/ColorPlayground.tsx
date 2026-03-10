import { useState, useEffect } from "react";
import { Check, Plus, X } from "lucide-react";

const COLOR_PALETTE = {
  "蓝色系": [
    { label: "深海蓝", color: "#1B3A5C" },
    { label: "靛青", color: "#2B4C7E" },
    { label: "钴蓝", color: "#2456A4" },
    { label: "皇家蓝", color: "#3A5BA0" },
    { label: "天青", color: "#4A90D9" },
    { label: "湖蓝", color: "#2980B9" },
    { label: "青石", color: "#34697A" },
    { label: "雾蓝", color: "#5B7F95" },
  ],
  "红色系": [
    { label: "酒红", color: "#8B2252" },
    { label: "砖红", color: "#A0522D" },
    { label: "赤陶", color: "#C0503A" },
    { label: "珊瑚红", color: "#D94F4F" },
    { label: "胭脂", color: "#C44569" },
    { label: "玫红", color: "#D63384" },
    { label: "柿红", color: "#E25822" },
    { label: "朱砂", color: "#CC3333" },
  ],
  "绿色系": [
    { label: "松柏绿", color: "#1A5E3A" },
    { label: "森林绿", color: "#2A7A4B" },
    { label: "翡翠", color: "#2E8B57" },
    { label: "橄榄绿", color: "#556B2F" },
    { label: "苔藓", color: "#4A7C59" },
    { label: "薄荷", color: "#3AA278" },
    { label: "青竹", color: "#2D8E6F" },
    { label: "鼠尾草", color: "#6B8E6B" },
  ],
  "紫色系": [
    { label: "深紫", color: "#5B2C6F" },
    { label: "雅紫", color: "#7B4EA3" },
    { label: "薰衣草", color: "#7C5CBF" },
    { label: "丁香", color: "#9B6DB7" },
    { label: "紫藤", color: "#8E6BBE" },
    { label: "葡萄紫", color: "#6A3D9A" },
    { label: "梅紫", color: "#8B458B" },
    { label: "鸢尾紫", color: "#6C5B9E" },
  ],
  "橙/棕色系": [
    { label: "琥珀橙", color: "#C7742E" },
    { label: "焦糖", color: "#A0692E" },
    { label: "肉桂", color: "#B5651D" },
    { label: "蜂蜜", color: "#B8860B" },
    { label: "铜棕", color: "#9C5935" },
    { label: "陶土", color: "#A86540" },
    { label: "姜黄", color: "#C49000" },
    { label: "赭石", color: "#8B6914" },
  ],
  "灰/中性色": [
    { label: "墨黑", color: "#1C1C1E" },
    { label: "炭灰", color: "#333333" },
    { label: "石板灰", color: "#4A5E6D" },
    { label: "铅灰", color: "#5C6B77" },
    { label: "暖灰", color: "#6B6256" },
    { label: "冷灰", color: "#6C7A89" },
    { label: "银鼠", color: "#848484" },
    { label: "烟灰", color: "#708090" },
  ],
};

const SAMPLE_PARAGRAPHS = [
  "与其在模型层内卷，不如想想怎么把 Context 喂得更优雅。好的 Prompt 工程就像好的产品设计——看似简单，背后是大量的迭代和取舍。",
  "这段文字用来展示不同颜色在长文本中的视觉效果。一个好的配色方案需要在阅读时既醒目又不刺眼，既有辨识度又保持整体和谐。字体大小、行高、字间距都会影响颜色的最终呈现。",
  "在小红书的图文排版中，颜色的运用至关重要。标题需要醒目，正文需要舒适，强调部分需要恰到好处地吸引注意力。太多颜色会显得杂乱，太少又会单调乏味。",
];

const STORAGE_KEY = "color-playground-selected";
const CUSTOM_COLORS_KEY = "color-playground-custom";

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const ColorPlayground = () => {
  const [selected, setSelected] = useState<Set<string>>(() =>
    new Set(loadFromStorage<string[]>(STORAGE_KEY, ["#2B4C7E", "#D94F4F", "#2A7A4B", "#7B4EA3", "#C7742E", "#4A5E6D"]))
  );
  const [customColors, setCustomColors] = useState<{ label: string; color: string }[]>(() =>
    loadFromStorage(CUSTOM_COLORS_KEY, [])
  );
  const [newColor, setNewColor] = useState("#5A7D9A");
  const [newLabel, setNewLabel] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Persist selections
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
  }, [selected]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(customColors));
  }, [customColors]);

  const toggle = (color: string) => {
    setSelected((prev) => {
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
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(color);
      return next;
    });
  };

  const allColors = [
    ...Object.values(COLOR_PALETTE).flat(),
    ...customColors,
  ];

  const selectedColors = allColors.filter((c) => selected.has(c.color));

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🎨 颜色选择器</h1>
            <p className="text-sm text-muted-foreground mt-1">
              点击色块选中/取消，已选 {selected.size} 个 · 选择自动保存
            </p>
          </div>
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            ← 返回编辑器
          </a>
        </div>

        {/* Live preview with long text */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            实时预览效果
          </h2>

          {/* Full color swatches */}
          {selectedColors.length > 0 && (
            <div className="flex gap-2.5 flex-wrap">
              {selectedColors.map((c) => (
                <div key={c.color} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full shadow-sm border-2 border-background"
                    style={{ background: c.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">{c.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Simulated card preview */}
          <div className="bg-white rounded-lg p-8 shadow-sm border border-border/50 space-y-5 max-w-lg">
            <h3
              className="text-xl font-bold"
              style={{ color: selectedColors[0]?.color ?? "#1a1a1a" }}
            >
              好的排版，是无声的说服力
            </h3>
            {SAMPLE_PARAGRAPHS.map((text, i) => {
              const color = selectedColors[i % selectedColors.length]?.color;
              return (
                <p
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{ color: i === 0 ? "#303030" : undefined }}
                >
                  {i === 0 ? (
                    <>
                      {text.slice(0, 12)}
                      {selectedColors.map((c, j) => (
                        <span key={j} style={{ color: c.color, fontWeight: 600 }}>
                          {j === 0 ? text.slice(12, 24) : ""}
                        </span>
                      ))}
                      {text.slice(24)}
                    </>
                  ) : (
                    <span style={{ color }}>{text}</span>
                  )}
                </p>
              );
            })}
            {/* Inline color demo */}
            <p className="text-sm leading-relaxed" style={{ color: "#303030" }}>
              混排效果：
              {selectedColors.map((c, i) => (
                <span key={c.color}>
                  <span style={{ color: c.color, fontWeight: 600 }}>{c.label}</span>
                  {i < selectedColors.length - 1 && "、"}
                </span>
              ))}
              ——每一种颜色都在传递不同的情绪。
            </p>
          </div>
        </div>

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
