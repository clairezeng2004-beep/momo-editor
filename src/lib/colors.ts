const STORAGE_KEY = "color-playground-selected";
const CUSTOM_COLORS_KEY = "color-playground-custom";

export interface ColorItem {
  label: string;
  color: string;
}

export const DEFAULT_COLORS: ColorItem[] = [
  { label: "深蓝", color: "#2B4C7E" },
  { label: "珊瑚红", color: "#D94F4F" },
  { label: "森林绿", color: "#2A7A4B" },
  { label: "雅紫", color: "#7B4EA3" },
  { label: "琥珀橙", color: "#C7742E" },
  { label: "石板灰", color: "#4A5E6D" },
];

export const COLOR_PALETTE: Record<string, ColorItem[]> = {
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

export function getSelectedColors(): ColorItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const customStored = localStorage.getItem(CUSTOM_COLORS_KEY);
    const selectedHexes: string[] = stored ? JSON.parse(stored) : DEFAULT_COLORS.map(c => c.color);
    const customColors: ColorItem[] = customStored ? JSON.parse(customStored) : [];
    
    const allColors = [...Object.values(COLOR_PALETTE).flat(), ...customColors];
    const colorMap = new Map(allColors.map(c => [c.color, c]));
    
    return selectedHexes
      .map(hex => colorMap.get(hex))
      .filter((c): c is ColorItem => !!c);
  } catch {
    return DEFAULT_COLORS;
  }
}
