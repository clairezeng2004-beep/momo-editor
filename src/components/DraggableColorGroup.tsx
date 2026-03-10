import { useState, useRef, useCallback } from "react";
import type { ColorItem } from "@/lib/colors";

const COLOR_ORDER_KEY = "color-palette-order";

interface DraggableColorGroupProps {
  group: string;
  colors: ColorItem[];
  wrap?: boolean;
  maxWidth?: string;
  onApplyColor: (color: string) => void;
}

function loadGroupOrder(group: string): number[] | null {
  try {
    const stored = localStorage.getItem(COLOR_ORDER_KEY);
    if (!stored) return null;
    const orders = JSON.parse(stored);
    return orders[group] ?? null;
  } catch {
    return null;
  }
}

function saveGroupOrder(group: string, order: number[]) {
  try {
    const stored = localStorage.getItem(COLOR_ORDER_KEY);
    const orders = stored ? JSON.parse(stored) : {};
    orders[group] = order;
    localStorage.setItem(COLOR_ORDER_KEY, JSON.stringify(orders));
  } catch {}
}

export function getOrderedColors(group: string, colors: ColorItem[]): ColorItem[] {
  const order = loadGroupOrder(group);
  if (!order || order.length !== colors.length) return colors;
  return order.map((i) => colors[i]).filter(Boolean);
}

const DraggableColorGroup = ({
  group,
  colors: rawColors,
  wrap = false,
  maxWidth,
  onApplyColor,
}: DraggableColorGroupProps) => {
  const [orderedColors, setOrderedColors] = useState<ColorItem[]>(() =>
    getOrderedColors(group, rawColors)
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const isDragging = useRef(false);

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
    isDragging.current = true;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  }, []);

  const handleDrop = useCallback(
    (targetIdx: number) => {
      if (dragIdx === null || dragIdx === targetIdx) {
        setDragIdx(null);
        setOverIdx(null);
        isDragging.current = false;
        return;
      }
      const newOrder = [...orderedColors];
      const [moved] = newOrder.splice(dragIdx, 1);
      newOrder.splice(targetIdx, 0, moved);
      setOrderedColors(newOrder);

      // Save order as indices into the original rawColors
      const indices = newOrder.map((c) => rawColors.findIndex((r) => r.color === c.color));
      saveGroupOrder(group, indices);

      setDragIdx(null);
      setOverIdx(null);
      isDragging.current = false;
    },
    [dragIdx, orderedColors, rawColors, group]
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
    isDragging.current = false;
  }, []);

  // Touch-based long press drag
  const touchStartIdx = useRef<number | null>(null);

  const handleTouchStart = useCallback((idx: number) => {
    touchStartIdx.current = idx;
    longPressTimer.current = setTimeout(() => {
      handleDragStart(idx);
    }, 400);
  }, [handleDragStart]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isDragging.current && dragIdx !== null && overIdx !== null) {
      handleDrop(overIdx);
    } else {
      setDragIdx(null);
      setOverIdx(null);
      isDragging.current = false;
    }
  }, [dragIdx, overIdx, handleDrop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el) {
      const idx = el.getAttribute("data-color-idx");
      if (idx !== null) setOverIdx(Number(idx));
    }
  }, []);

  const containerClass = wrap
    ? "flex gap-2 flex-wrap pb-1"
    : "flex gap-2 w-max";

  return (
    <div
      className={wrap ? "" : "overflow-x-auto pb-1.5 scrollbar-hide"}
      style={maxWidth ? { maxWidth } : undefined}
      onTouchMove={handleTouchMove}
    >
      <div className={containerClass}>
        {orderedColors.map((c, idx) => (
          <button
            key={c.color}
            data-color-idx={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            onTouchStart={() => handleTouchStart(idx)}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (!isDragging.current) onApplyColor(c.color);
            }}
            className={`w-7 h-7 shrink-0 rounded-full border transition-all ${
              dragIdx === idx
                ? "opacity-40 scale-90 border-foreground/60"
                : overIdx === idx && dragIdx !== null
                ? "scale-125 border-foreground shadow-lg"
                : "border-border/60 hover:scale-110"
            }`}
            style={{ backgroundColor: c.color }}
            title={c.label}
          />
        ))}
      </div>
    </div>
  );
};

export default DraggableColorGroup;
