export interface TemplateStyle {
  id: string;
  name: string;
  className: string;
  previewBg: string;
  previewText: string;
}

export const TEMPLATES: TemplateStyle[] = [
  {
    id: "apple-notes",
    name: "备忘录",
    className: "template-apple-notes",
    previewBg: "#f5f5f4",
    previewText: "#555555",
  },
  {
    id: "clean",
    name: "简约白",
    className: "template-clean",
    previewBg: "#f7f7f6",
    previewText: "#555555",
  },
  {
    id: "warm",
    name: "暖纸色",
    className: "template-warm",
    previewBg: "#fef9f0",
    previewText: "#8b6914",
  },
  {
    id: "ink",
    name: "深夜墨",
    className: "template-ink",
    previewBg: "#1a1a2e",
    previewText: "#7ec8e3",
  },
  {
    id: "mint",
    name: "薄荷绿",
    className: "template-mint",
    previewBg: "#f0faf5",
    previewText: "#1a7a4a",
  },
  {
    id: "rose",
    name: "玫瑰粉",
    className: "template-rose",
    previewBg: "#fef5f5",
    previewText: "#c44569",
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

export const DEFAULT_MARKDOWN = `# 聊聊 Context 的重要性

模型的进步是上涨的潮水，那是头部大厂的残酷战场，顶尖模型的迭代周期以「月」计。

## 核心观点

**长期看 Context 的重要性远大于模型。**

1. 不追求做自研模型，All in Context Engineering
2. 让产品与底层模型保持正交
3. 放弃追逐不断上涨水位的幻想

> 与其在模型层内卷，不如想想怎么把 Context 喂得更优雅。

---

这其实撕下了一层遮盖布：大多数所谓的"垂类模型护城河"，在强大的 Context Engineering 和下一代基座模型面前，可能不堪一击。
`;
