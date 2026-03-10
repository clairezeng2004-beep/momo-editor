import { useEffect, useState, useCallback, useRef } from "react";
import { Bold, AlignLeft, AlignCenter, AlignJustify } from "lucide-react";
import { getSelectedColors, type ColorItem } from "@/lib/colors";

interface FloatingToolbarProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onContentChange?: () => void;
}

const getBlockElement = (node: Node | null): HTMLElement | null => {
  const blockTags = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE", "DIV"]);
  let el = node instanceof HTMLElement ? node : node?.parentElement ?? null;
  while (el) {
    if (blockTags.has(el.tagName)) return el;
    el = el.parentElement;
  }
  return null;
};

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

  const applyAlign = (e: React.MouseEvent, align: string) => {
    e.preventDefault();
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    // Get all block elements in the selection range
    const range = selection.getRangeAt(0);
    const startBlock = getBlockElement(range.startContainer);
    const endBlock = getBlockElement(range.endContainer);

    if (startBlock) {
      // Collect all blocks between start and end
      const blocks: HTMLElement[] = [];
      let current: HTMLElement | null = startBlock;
      while (current) {
        blocks.push(current);
        if (current === endBlock) break;
        const next = current.nextElementSibling as HTMLElement | null;
        current = next;
      }
      blocks.forEach((block) => {
        block.style.textAlign = align;
      });
    }

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
      onMouseDown={(e) => e.preventDefault()}
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
      <div className="w-px h-4 bg-border mx-0.5" />
      <button
        onMouseDown={(e) => applyAlign(e, "left")}
        className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors"
        title="左对齐"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>
      <button
        onMouseDown={(e) => applyAlign(e, "center")}
        className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors"
        title="居中"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>
      <button
        onMouseDown={(e) => applyAlign(e, "justify")}
        className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors"
        title="两端对齐"
      >
        <AlignJustify className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default FloatingToolbar;
