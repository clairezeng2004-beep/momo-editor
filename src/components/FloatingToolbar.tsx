import { useEffect, useState, useCallback, useRef } from "react";
import { Bold } from "lucide-react";

const TEXT_COLORS = [
  { label: "深蓝", color: "#2B4C7E" },
  { label: "珊瑚红", color: "#D94F4F" },
  { label: "森林绿", color: "#2A7A4B" },
  { label: "雅紫", color: "#7B4EA3" },
  { label: "琥珀橙", color: "#C7742E" },
  { label: "石板灰", color: "#4A5E6D" },
];

interface FloatingToolbarProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onContentChange?: () => void;
}

const FloatingToolbar = ({ containerRef, onContentChange }: FloatingToolbarProps) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    if (
      !selection ||
      selection.isCollapsed ||
      !containerRef.current ||
      !containerRef.current.contains(selection.anchorNode)
    ) {
      setVisible(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setPosition({
      top: rect.top - containerRect.top - 44,
      left: rect.left - containerRect.left + rect.width / 2,
    });
    setVisible(true);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", updatePosition);
    return () => document.removeEventListener("selectionchange", updatePosition);
  }, [updatePosition]);

  const applyBold = (e: React.MouseEvent) => {
    e.preventDefault();
    document.execCommand("bold");
    onContentChange?.();
  };

  const applyColor = (e: React.MouseEvent, color: string) => {
    e.preventDefault();
    document.execCommand("foreColor", false, color);
    onContentChange?.();
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg px-2 py-1.5"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
      onMouseDown={(e) => e.preventDefault()} // prevent losing selection
    >
      <button
        onMouseDown={applyBold}
        className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors"
        title="加粗"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-border mx-0.5" />
      {TEXT_COLORS.map((c) => (
        <button
          key={c.color}
          onMouseDown={(e) => applyColor(e, c.color)}
          className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground/30 transition-colors flex items-center justify-center"
          title={c.label}
        >
          <div
            className="w-4 h-4 rounded-full"
            style={{ background: c.color }}
          />
        </button>
      ))}
    </div>
  );
};

export default FloatingToolbar;
