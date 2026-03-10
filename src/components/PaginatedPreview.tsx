import { useRef, useEffect, useState, useCallback } from "react";
import FloatingToolbar from "@/components/FloatingToolbar";

interface PaginatedPreviewProps {
  html: string;
  cardWidth: number;
  cardHeight: number;
  fontSize: number;
  textAlign: string;
  templateClassName: string;
  templateBackground: string;
  onContentChange: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
  directHtml: string | null;
  markdown: string;
}

const FOOTER_HEIGHT = 28;

const PaginatedPreview = ({
  html,
  cardWidth,
  cardHeight,
  fontSize,
  textAlign,
  templateClassName,
  templateBackground,
  onContentChange,
  contentRef,
  directHtml,
  markdown,
}: PaginatedPreviewProps) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const padding = { x: fontSize * 1.6, y: fontSize * 1.8 };
  const contentHeight = cardHeight - padding.y * 2 - FOOTER_HEIGHT;

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
      {/* Hidden measure container */}
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
                display: "flex",
                flexDirection: "column",
              }}
            >
              {idx === 0 && (
                <FloatingToolbar
                  containerRef={{ current: cardRefs.current[0] } as React.RefObject<HTMLDivElement>}
                  onContentChange={onContentChange}
                />
              )}
              {/* Content viewport */}
              <div
                style={{
                  flex: 1,
                  height: contentHeight,
                  overflow: "hidden",
                }}
              >
                <div
                  className="markdown-body"
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: html }}
                  onInput={onContentChange}
                  style={{
                    outline: "none",
                    marginTop: idx === 0 ? 0 : -(idx * contentHeight),
                    cursor: "text",
                  }}
                />
              </div>
              {/* Footer */}
              <div
                style={{
                  height: FOOTER_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: "#C8A951",
                  letterSpacing: "0.02em",
                  flexShrink: 0,
                  paddingTop: 4,
                  margin: `0 -${padding.x}px`,
                  padding: `0 ${padding.x}px`,
                }}
              >
                <span
                  contentEditable
                  suppressContentEditableWarning
                  style={{ opacity: 0.85, outline: "none", cursor: "text" }}
                >
                  小红书@热可可
                </span>
                {totalPages > 1 && (
                  <span style={{ opacity: 0.7 }}>{idx + 1}/{totalPages}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default PaginatedPreview;
