import { useState } from "react";
import { Check, Copy } from "lucide-react";

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

const SAMPLE_TEXT = "与其在模型层内卷，不如想想怎么把 Context 喂得更优雅。";

const ColorPlayground = () => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["#2B4C7E", "#D94F4F", "#2A7A4B", "#7B4EA3", "#C7742E", "#4A5E6D"])
  );
  const [copied, setCopied] = useState(false);

  const toggle = (color: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  };

  const exportSelection = () => {
    const items = Object.values(COLOR_PALETTE)
      .flat()
      .filter((c) => selected.has(c.color));
    const code = items
      .map((c) => `  { label: "${c.label}", color: "${c.color}" },`)
      .join("\n");
    navigator.clipboard.writeText(`[\n${code}\n]`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🎨 颜色选择器 Playground</h1>
            <p className="text-sm text-muted-foreground mt-1">
              点击色块选中/取消，已选 {selected.size} 个颜色
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              ← 返回编辑器
            </a>
            <button
              onClick={exportSelection}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "已复制" : "复制选中配置"}
            </button>
          </div>
        </div>

        {/* Selected preview strip */}
        {selected.size > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              已选颜色预览
            </h2>
            <div className="flex gap-3 flex-wrap">
              {Object.values(COLOR_PALETTE)
                .flat()
                .filter((c) => selected.has(c.color))
                .map((c) => (
                  <div key={c.color} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-10 h-10 rounded-full shadow-md border-2 border-background"
                      style={{ background: c.color }}
                    />
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                  </div>
                ))}
            </div>
            <div className="mt-3 p-4 bg-background rounded-lg">
              <p className="text-sm leading-relaxed">
                {Object.values(COLOR_PALETTE)
                  .flat()
                  .filter((c) => selected.has(c.color))
                  .map((c, i) => (
                    <span key={c.color}>
                      <span style={{ color: c.color, fontWeight: 600 }}>{c.label}</span>
                      {i < selected.size - 1 && " · "}
                    </span>
                  ))}
              </p>
              <p className="text-sm mt-2 text-muted-foreground">
                {Object.values(COLOR_PALETTE)
                  .flat()
                  .filter((c) => selected.has(c.color))
                  .map((c, i) => (
                    <span key={c.color}>
                      {i === 0 ? (
                        <span style={{ color: c.color }}>{SAMPLE_TEXT}</span>
                      ) : null}
                    </span>
                  ))}
              </p>
            </div>
          </div>
        )}

        {/* Color categories */}
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
                      <div className="text-xs text-muted-foreground font-mono">
                        {c.color}
                      </div>
                      <div
                        className="text-xs mt-0.5 truncate"
                        style={{ color: c.color }}
                      >
                        示例文字
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
