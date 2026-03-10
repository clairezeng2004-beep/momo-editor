import { useRef, useEffect, useState, useCallback } from "react";
import FloatingToolbar from "@/components/FloatingToolbar";

interface PaginatedPreviewProps {
  html: string;
  cardWidth: number;
  cardHeight: number;
  fontSize: number;
  textAlign: string;
  templateClassName: string;
  onContentChange: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
  directHtml: string | null;
  markdown: string;
}

const PaginatedPreview = ({
  html,
  cardWidth,
  cardHeight,
  fontSize,
  textAlign,
  templateClassName,
  onContentChange,
  contentRef,
  directHtml,
  markdown,
}: PaginatedPreviewProps) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const padding = { x: fontSize * 1.6, y: fontSize * 1.8 };
  const contentHeight = cardHeight - padding.y * 2;

  // Measure total content height and compute pages
  const paginate = useCallback(() => {
    const container = measureRef.current;
    if (!container) return;
    const totalH = container.scrollHeight;
    if (totalH <= 0) {
      setTotalPages(1);
      return;
    }
    setTotalPages(Math.max(1, Math.ceil(totalH / contentHeight)));
  }, [contentHeight]);

  useEffect(() => {
    const timer = setTimeout(paginate, 50);
    return () => clearTimeout(timer);
  }, [html, paginate, fontSize, cardWidth, cardHeight]);

  return (
    <>
      {/* Hidden measure container — full content rendered to get total height */}
      <div
        ref={measureRef}
        className={`${templateClassName} markdown-body`}
        style={{
          position: "absolute",
          visibility: "hidden",
          width: cardWidth - padding.x * 2,
          fontSize: `${fontSize}px`,
          textAlign: textAlign as any,
          fontFamily: '"Noto Sans SC", system-ui, -apple-system, sans-serif',
          lineHeight: "2.0",
          pointerEvents: "none",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Page cards */}
      <div className="flex flex-col items-center gap-6">
        {Array.from({ length: totalPages }, (_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            {totalPages > 1 && (
              <p className="text-[10px] text-muted-foreground">
                {idx + 1} / {totalPages}
              </p>
            )}
            <div
              ref={(el) => {
                cardRefs.current[idx] = el;
                if (idx === 0 && contentRef) {
                  (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                }
              }}
              className={`${templateClassName} shadow-2xl relative`}
              data-page-index={idx}
              style={{
                width: cardWidth,
                height: cardHeight,
                fontFamily: '"Noto Sans SC", system-ui, -apple-system, sans-serif',
                fontSize: `${fontSize}px`,
                padding: `${padding.y}px ${padding.x}px`,
                borderRadius: 0,
                boxSizing: "border-box",
                textAlign: textAlign as any,
                overflow: "hidden",
              }}
            >
              {idx === 0 && (
                <FloatingToolbar
                  containerRef={{ current: cardRefs.current[0] } as React.RefObject<HTMLDivElement>}
                  onContentChange={onContentChange}
                />
              )}
              {/* Content viewport: offset by page index * contentHeight */}
              <div
                style={{
                  height: contentHeight,
                  overflow: "hidden",
                }}
              >
                <div
                  className="markdown-body"
                  contentEditable={idx === 0}
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: html }}
                  onInput={idx === 0 ? onContentChange : undefined}
                  style={{
                    outline: "none",
                    marginTop: idx === 0 ? 0 : -(idx * contentHeight),
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default PaginatedPreview;
