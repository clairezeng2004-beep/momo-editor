import { useState, useEffect } from "react";
import { Bold } from "lucide-react";
import { getSelectedColors, type ColorItem } from "@/lib/colors";

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

  // Restore cursor after React re-render
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start + before.length, end + before.length);
  });
};

const FormatToolbar = ({ textareaRef, markdown, onChange }: FormatToolbarProps) => {
  const [textColors, setTextColors] = useState<ColorItem[]>(getSelectedColors);

  // Re-read colors on focus (in case user changed them on /colors page)
  useEffect(() => {
    const refresh = () => setTextColors(getSelectedColors());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const handleBold = () => {
    if (!textareaRef.current) return;
    wrapSelection(textareaRef.current, markdown, "**", "**", onChange);
  };

  const handleColor = (color: string) => {
    if (!textareaRef.current) return;
    wrapSelection(
      textareaRef.current,
      markdown,
      `<span style="color:${color}">`,
      "</span>",
      onChange
    );
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={handleBold}
        className="w-8 h-8 rounded-md flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        title="加粗"
      >
        <Bold className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-border mx-1" />
      {textColors.map((c) => (
        <button
          key={c.color}
          onClick={() => handleColor(c.color)}
          className="w-7 h-7 rounded-full border-2 border-transparent hover:border-foreground/30 transition-colors flex items-center justify-center"
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
