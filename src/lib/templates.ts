export interface TemplateStyle {
  id: string;
  name: string;
  className: string;
  previewBg: string;
  previewText: string;
  /** Inline background style applied to the card for accurate export */
  background: string;
}

export const TEMPLATES: TemplateStyle[] = [
  {
    id: "apple-notes",
    name: "备忘录",
    className: "template-apple-notes",
    previewBg: "#ffffff",
    previewText: "#555555",
    background: "#ffffff",
  },
  {
    id: "clean",
    name: "简约白",
    className: "template-clean",
    previewBg: "#f7f7f6",
    previewText: "#555555",
    background: "#f7f7f6",
  },
  {
    id: "warm",
    name: "暖纸色",
    className: "template-warm",
    previewBg: "#fef9f0",
    previewText: "#8b6914",
    background: "linear-gradient(180deg, #fef9f0 0%, #fdf6e9 100%)",
  },
  {
    id: "ink",
    name: "深夜墨",
    className: "template-ink",
    previewBg: "#1a1a2e",
    previewText: "#7ec8e3",
    background: "#1a1a2e",
  },
  {
    id: "mint",
    name: "薄荷绿",
    className: "template-mint",
    previewBg: "#f0faf5",
    previewText: "#1a7a4a",
    background: "linear-gradient(180deg, #f0faf5 0%, #e8f5ee 100%)",
  },
  {
    id: "rose",
    name: "玫瑰粉",
    className: "template-rose",
    previewBg: "#fef5f5",
    previewText: "#c44569",
    background: "linear-gradient(180deg, #fef5f5 0%, #fdeef0 100%)",
  },
];

export interface AspectRatio {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const ASPECT_RATIOS: AspectRatio[] = [
  { id: "3:4", label: "3:4", width: 3, height: 4 },
  { id: "4:5", label: "4:5", width: 4, height: 5 },
  { id: "9:16", label: "9:16", width: 9, height: 16 },
  { id: "1:1", label: "1:1", width: 1, height: 1 },
  { id: "4:3", label: "4:3", width: 4, height: 3 },
];

export const DEFAULT_MARKDOWN = `# 欢迎使用 Momo Editor 👋

这是一级标题，用 \`# \` 开头

## 二级标题用两个井号

**这段文字是加粗的**，普通文字紧跟其后。

你可以用 *斜体* 来强调某个词语。

> 这是一段引用，适合放金句或重点摘要。

支持有序列表：

1. 第一点：直接输入内容
2. 第二点：换行自动分段
3. 第三点：选中文字可用工具栏加粗、变色

- 也支持无序列表
- 用减号开头即可

---

分割线上方是正文，下方可以写落款或备注。试试在预览区直接编辑文字吧！
`;
