import { useState, useEffect, useRef, useCallback } from "react";
import { Bold } from "lucide-react";
import { getSelectedColors, type ColorItem } from "@/lib/colors";

const TOOLBAR_ORDER_KEY = "format-toolbar-color-order";

interface FormatToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  markdown: string;
  onChange: (value: string) => void;
}

const wrapSelection = (
  textarea: HTMLTextAreaElement,
  markdown: string,
  before: string,
  after: string,
  onChange: (v: string) => void
) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  if (start === end) return;

  const selected = markdown.slice(start, end);
  const newText = markdown.slice(0, start) + before + selected + after + markdown.slice(end);
  onChange(newText);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start + before.length, end + before.length);
  });
};

function loadOrder(colors: ColorItem[]): ColorItem[] {
  try {
    const stored = localStorage.getItem(TOOLBAR_ORDER_KEY);
    if (!stored) return colors;
    const hexOrder: string[] = JSON.parse(stored);
    const colorMap = new Map(colors.map((c) => [c.color, c]));
    const ordered = hexOrder.map((h) => colorMap.get(h)).filter(Boolean) as ColorItem[];
    // Append any new colors not in the saved order
    const inOrder = new Set(hexOrder);
    for (const c of colors) {
      if (!inOrder.has(c.color)) ordered.push(c);
    }
    return ordered;
  } catch {
    return colors;
  }
}

function saveOrder(colors: ColorItem[]) {
  localStorage.setItem(TOOLBAR_ORDER_KEY, JSON.stringify(colors.map((c) => c.color)));
}

const FormatToolbar = ({ textareaRef, markdown, onChange }: FormatToolbarProps) => {
  const [textColors, setTextColors] = useState<ColorItem[]>(() =>
    loadOrder(getSelectedColors())
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const isDragging = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  // Re-read colors on focus
  useEffect(() => {
    const refresh = () => setTextColors(loadOrder(getSelectedColors()));
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const handleBold = () => {
    if (!textareaRef.current) return;
    wrapSelection(textareaRef.current, markdown, "**", "**", onChange);
  };

  const handleColor = (color: string) => {
    if (isDragging.current) return;
    if (!textareaRef.current) return;
    wrapSelection(
      textareaRef.current,
      markdown,
      `<span style="color:${color}">`,
      "</span>",
      onChange
    );
  };

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
      const newOrder = [...textColors];
      const [moved] = newOrder.splice(dragIdx, 1);
      newOrder.splice(targetIdx, 0, moved);
      setTextColors(newOrder);
      saveOrder(newOrder);
      setDragIdx(null);
      setOverIdx(null);
      isDragging.current = false;
    },
    [dragIdx, textColors]
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
    isDragging.current = false;
  }, []);

  const handleTouchStart = useCallback(
    (idx: number) => {
      longPressTimer.current = setTimeout(() => {
        handleDragStart(idx);
      }, 400);
    },
    [handleDragStart]
  );

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
      const idx = el.getAttribute("data-toolbar-color-idx");
      if (idx !== null) setOverIdx(Number(idx));
    }
  }, []);

  return (
    <div className="flex items-center gap-1.5 flex-wrap" onTouchMove={handleTouchMove}>
      <button
        onClick={handleBold}
        className="w-8 h-8 rounded-md flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        title="加粗"
      >
        <Bold className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-border mx-1" />
      {textColors.map((c, idx) => (
        <button
          key={c.color}
          data-toolbar-color-idx={idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          onDragEnd={handleDragEnd}
          onTouchStart={() => handleTouchStart(idx)}
          onTouchEnd={handleTouchEnd}
          onClick={() => handleColor(c.color)}
          className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
            dragIdx === idx
              ? "opacity-40 scale-90 border-foreground/60"
              : overIdx === idx && dragIdx !== null
              ? "scale-125 border-foreground shadow-lg"
              : "border-transparent hover:border-foreground/30"
          }`}
          title={c.label}
        >
          <div
            className="w-5 h-5 rounded-full shadow-sm"
            style={{ background: c.color }}
          />
        </button>
      ))}
    </div>
  );
};

export default FormatToolbar;
