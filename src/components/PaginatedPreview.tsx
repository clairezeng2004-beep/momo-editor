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

interface PageData {
  startIndex: number;
  endIndex: number; // exclusive
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
  const [pages, setPages] = useState<PageData[]>([{ startIndex: 0, endIndex: -1 }]);

  const padding = { x: fontSize * 1.8, y: fontSize * 2.2 };
  const contentHeight = cardHeight - padding.y * 2;

  // Measure and paginate
  const paginate = useCallback(() => {
    const container = measureRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) {
      setPages([{ startIndex: 0, endIndex: 0 }]);
      return;
    }

    const newPages: PageData[] = [];
    let currentPageStart = 0;
    let accumulatedHeight = 0;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const style = window.getComputedStyle(child);
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      const childHeight = child.offsetHeight + marginTop + marginBottom;

      if (accumulatedHeight + childHeight > contentHeight && accumulatedHeight > 0) {
        newPages.push({ startIndex: currentPageStart, endIndex: i });
        currentPageStart = i;
        accumulatedHeight = childHeight;
      } else {
        accumulatedHeight += childHeight;
      }
    }
    // Last page
    newPages.push({ startIndex: currentPageStart, endIndex: children.length });
    setPages(newPages);
  }, [contentHeight]);

  useEffect(() => {
    // Small delay to let the hidden measure div render
    const timer = setTimeout(paginate, 50);
    return () => clearTimeout(timer);
  }, [html, paginate, fontSize, cardWidth, cardHeight]);

  // Build HTML for each page by slicing top-level elements
  const getPageHtml = useCallback(
    (page: PageData) => {
      const container = measureRef.current;
      if (!container) return html;
      const children = Array.from(container.children);
      if (page.endIndex === -1) return html; // fallback single page

      const fragment = document.createElement("div");
      for (let i = page.startIndex; i < page.endIndex; i++) {
        if (children[i]) fragment.appendChild(children[i].cloneNode(true));
      }
      return fragment.innerHTML;
    },
    [html]
  );

  const [pageHtmls, setPageHtmls] = useState<string[]>([html]);

  useEffect(() => {
    if (pages.length === 1 && pages[0].endIndex === -1) {
      setPageHtmls([html]);
      return;
    }
    // Need to wait for measure div
    const timer = setTimeout(() => {
      setPageHtmls(pages.map((p) => getPageHtml(p)));
    }, 60);
    return () => clearTimeout(timer);
  }, [pages, html, getPageHtml]);

  const totalPages = pageHtmls.length;

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
        {pageHtmls.map((pageHtml, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            {totalPages > 1 && (
              <p className="text-[10px] text-muted-foreground">
                {idx + 1} / {totalPages}
              </p>
            )}
            <div
              ref={(el) => {
                cardRefs.current[idx] = el;
                // First page gets the export ref
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
              <div
                className="markdown-body"
                contentEditable={idx === 0}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: pageHtml }}
                onInput={idx === 0 ? onContentChange : undefined}
                style={{ outline: "none" }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default PaginatedPreview;
