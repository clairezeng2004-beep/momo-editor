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
  { id: "long", label: "长图", width: 3, height: 4 },
];

export const DEFAULT_MARKDOWN = `# Momo Editor 使用指南

欢迎！这是一篇教程卡片，帮你快速上手所有排版格式。

## 标题层级

上面的「Momo Editor 使用指南」是 **一级标题**，字号最大、最醒目，适合做封面主标题。

本行「标题层级」是 **二级标题**，适合分章节使用。

## 文字强调

**加粗文字** 用来突出关键信息，选中文字后点击工具栏的 **B** 即可。

*斜体文字* 用来做轻度强调，比如书名、术语。

你也可以混合使用：***加粗又倾斜***。

## 引用块

> 引用块适合放名人名言、重点摘要或提示信息。
> 在编辑器中用 \`>\` 开头即可生成。

## 列表

有序列表，适合写步骤：

1. 选中你想编辑的文字
2. 点击上方工具栏选择格式
3. 实时预览效果，所见即所得

无序列表，适合罗列要点：

- 支持加粗、斜体、变色
- 支持一级/二级标题切换
- 支持引用块和分割线

---

*左侧编辑，右侧预览。试试选中这段文字，给它换个颜色吧！*
`;

