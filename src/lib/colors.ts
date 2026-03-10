const STORAGE_KEY = "color-playground-selected";
const CUSTOM_COLORS_KEY = "color-playground-custom";

export interface ColorItem {
  label: string;
  color: string;
}

export const DEFAULT_COLORS: ColorItem[] = [
  { label: "红", color: "#FF3B30" },
  { label: "橙", color: "#FF9500" },
  { label: "绿", color: "#34C759" },
  { label: "蓝", color: "#007AFF" },
  { label: "紫", color: "#AF52DE" },
  { label: "墨黑", color: "#1C1C1E" },
];

// Apple-style color palette, each row sorted light → dark
export const COLOR_PALETTE: Record<string, ColorItem[]> = {
  "红色": [
    { label: "浅红", color: "#FFADAD" },
    { label: "粉红", color: "#FF6B6B" },
    { label: "红", color: "#FF3B30" },
    { label: "深红", color: "#D70015" },
    { label: "暗红", color: "#A30012" },
  ],
  "橙色": [
    { label: "浅橙", color: "#FFD6A5" },
    { label: "杏橙", color: "#FFAB5E" },
    { label: "橙", color: "#FF9500" },
    { label: "深橙", color: "#DB7E00" },
    { label: "暗橙", color: "#A85F00" },
  ],
  "黄色": [
    { label: "浅黄", color: "#FFF3BF" },
    { label: "明黄", color: "#FFE066" },
    { label: "黄", color: "#FFCC00" },
    { label: "深黄", color: "#D4A900" },
    { label: "暗黄", color: "#A68500" },
  ],
  "绿色": [
    { label: "浅绿", color: "#B7F5B5" },
    { label: "草绿", color: "#5DD55A" },
    { label: "绿", color: "#34C759" },
    { label: "深绿", color: "#248A3D" },
    { label: "暗绿", color: "#1B6B2F" },
  ],
  "青色": [
    { label: "浅青", color: "#B2F0E8" },
    { label: "薄荷", color: "#5AC8BB" },
    { label: "青", color: "#30B0A0" },
    { label: "深青", color: "#00A3A3" },
    { label: "暗青", color: "#007A7A" },
  ],
  "蓝色": [
    { label: "天蓝", color: "#A2D2FF" },
    { label: "浅蓝", color: "#64ACFF" },
    { label: "蓝", color: "#007AFF" },
    { label: "深蓝", color: "#0056CC" },
    { label: "暗蓝", color: "#003D99" },
  ],
  "靛蓝": [
    { label: "浅靛", color: "#C5CAE9" },
    { label: "靛青", color: "#7986CB" },
    { label: "靛蓝", color: "#5856D6" },
    { label: "深靛", color: "#3F3AB5" },
    { label: "暗靛", color: "#2D2A8F" },
  ],
  "紫色": [
    { label: "淡紫", color: "#E1BEE7" },
    { label: "浅紫", color: "#BA68C8" },
    { label: "紫", color: "#AF52DE" },
    { label: "深紫", color: "#8944AB" },
    { label: "暗紫", color: "#6B3590" },
  ],
  "粉色": [
    { label: "浅粉", color: "#FFD6E0" },
    { label: "桃粉", color: "#FF8FAB" },
    { label: "粉", color: "#FF2D55" },
    { label: "深粉", color: "#D9234B" },
    { label: "暗粉", color: "#B3193D" },
  ],
  "棕色": [
    { label: "浅棕", color: "#D7C4A9" },
    { label: "沙棕", color: "#BFA07A" },
    { label: "棕", color: "#A2845E" },
    { label: "深棕", color: "#7B6340" },
    { label: "暗棕", color: "#5A4730" },
  ],
  "灰色": [
    { label: "浅灰", color: "#C7C7CC" },
    { label: "灰", color: "#8E8E93" },
    { label: "深灰", color: "#636366" },
    { label: "暗灰", color: "#48484A" },
    { label: "墨黑", color: "#1C1C1E" },
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
