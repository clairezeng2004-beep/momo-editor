import { useEffect, useState, useCallback, useRef } from "react";
import { Bold, AlignLeft, AlignCenter, AlignJustify, Heading1, Heading2, Heading3, TextQuote, Type } from "lucide-react";
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
  const [hasSelection, setHasSelection] = useState(false);
  const [textColors, setTextColors] = useState<ColorItem[]>(getSelectedColors);

  useEffect(() => {
    setTextColors(getSelectedColors());
  }, [hasSelection]);

  const checkSelection = useCallback(() => {
    const selection = window.getSelection();
    const inContainer = selection &&
      !selection.isCollapsed &&
      containerRef.current &&
      containerRef.current.contains(selection.anchorNode);
    setHasSelection(!!inContainer);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", checkSelection);
    return () => document.removeEventListener("selectionchange", checkSelection);
  }, [checkSelection]);

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
    const range = selection.getRangeAt(0);
    const startBlock = getBlockElement(range.startContainer);
    const endBlock = getBlockElement(range.endContainer);
    if (startBlock) {
      const blocks: HTMLElement[] = [];
      let current: HTMLElement | null = startBlock;
      while (current) {
        blocks.push(current);
        if (current === endBlock) break;
        current = current.nextElementSibling as HTMLElement | null;
      }
      blocks.forEach((block) => { block.style.textAlign = align; });
    }
    onContentChange?.();
  };

  const applyBlockFormat = (e: React.MouseEvent, tagName: string) => {
    e.preventDefault();
    const selection = window.getSelection();
    if (!selection) return;
    const range = selection.getRangeAt(0);
    const block = getBlockElement(range.startContainer);
    if (!block || !block.parentElement) return;
    const savedContent = block.innerHTML;
    const currentTag = block.tagName.toUpperCase();
    const targetTag = currentTag === tagName.toUpperCase() ? "P" : tagName.toUpperCase();
    const newEl = document.createElement(targetTag);
    newEl.innerHTML = savedContent;
    if (block.style.textAlign) newEl.style.textAlign = block.style.textAlign;
    block.parentElement.replaceChild(newEl, block);
    const newRange = document.createRange();
    if (newEl.firstChild) {
      newRange.selectNodeContents(newEl);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    onContentChange?.();
  };

  const btnClass = `w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
    hasSelection ? "hover:bg-secondary/60 text-foreground" : "text-muted-foreground/40 cursor-default"
  }`;

  return (
    <div
      className="flex items-center gap-0.5 bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl px-2.5 py-1.5 flex-wrap justify-center"
      onMouseDown={(e) => e.preventDefault()}
    >
      <button onMouseDown={hasSelection ? (e) => applyBlockFormat(e, "H1") : undefined} className={btnClass} title="一级标题">
        <Heading1 className="w-3.5 h-3.5" />
      </button>
      <button onMouseDown={hasSelection ? (e) => applyBlockFormat(e, "H2") : undefined} className={btnClass} title="二级标题">
        <Heading2 className="w-3.5 h-3.5" />
      </button>
      <button onMouseDown={hasSelection ? (e) => applyBlockFormat(e, "H3") : undefined} className={btnClass} title="三级标题">
        <Heading3 className="w-3.5 h-3.5" />
      </button>
      <button onMouseDown={hasSelection ? (e) => applyBlockFormat(e, "P") : undefined} className={btnClass} title="正文">
        <Type className="w-3.5 h-3.5" />
      </button>
      <button onMouseDown={hasSelection ? (e) => applyBlockFormat(e, "BLOCKQUOTE") : undefined} className={btnClass} title="引用">
        <TextQuote className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-border/40 mx-0.5" />
      <button onMouseDown={hasSelection ? applyBold : undefined} className={btnClass} title="加粗">
        <Bold className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-border/40 mx-0.5" />
      {textColors.map((c) => (
        <button
          key={c.color}
          onMouseDown={hasSelection ? (e) => applyColor(e, c.color) : undefined}
          className={`w-6 h-6 rounded-full border-2 border-transparent flex items-center justify-center transition-colors ${
            hasSelection ? "hover:border-foreground/30" : "opacity-40 cursor-default"
          }`}
          title={c.label}
        >
          <div className="w-4 h-4 rounded-full" style={{ background: c.color }} />
        </button>
      ))}
      <div className="w-px h-4 bg-border/40 mx-0.5" />
      <button onMouseDown={hasSelection ? (e) => applyAlign(e, "left") : undefined} className={btnClass} title="左对齐">
        <AlignLeft className="w-3.5 h-3.5" />
      </button>
      <button onMouseDown={hasSelection ? (e) => applyAlign(e, "center") : undefined} className={btnClass} title="居中">
        <AlignCenter className="w-3.5 h-3.5" />
      </button>
      <button onMouseDown={hasSelection ? (e) => applyAlign(e, "justify") : undefined} className={btnClass} title="两端对齐">
        <AlignJustify className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default FloatingToolbar;
