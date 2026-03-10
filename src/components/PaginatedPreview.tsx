import { useRef, useEffect, useState, useCallback } from "react";

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
  footerEnabled?: boolean;
  footerText?: string;
  footerColor?: string;
}

interface PaginationState {
  offsets: number[];
  heights: number[];
}

const FOOTER_HEIGHT = 28;
const LINE_HEIGHT_RATIO = 2;
const PAGE_EPSILON = 1;

const getTextLineRects = (container: HTMLDivElement) => {
  const containerRect = container.getBoundingClientRect();
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.textContent?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });

  const rects: Array<{ top: number; bottom: number }> = [];

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    const range = document.createRange();
    range.selectNodeContents(textNode);

    for (const rect of Array.from(range.getClientRects())) {
      const top = rect.top - containerRect.top;
      const bottom = rect.bottom - containerRect.top;

      if (bottom - top > 1) {
        rects.push({ top, bottom });
      }
    }
  }

  rects.sort((a, b) => a.top - b.top || a.bottom - b.bottom);

  return rects.reduce<Array<{ top: number; bottom: number }>>((lines, rect) => {
    const last = lines[lines.length - 1];

    if (
      !last ||
      Math.abs(last.top - rect.top) > PAGE_EPSILON ||
      Math.abs(last.bottom - rect.bottom) > PAGE_EPSILON
    ) {
      lines.push({ top: rect.top, bottom: rect.bottom });
    } else {
      // Merge: extend the line's bottom if needed
      last.bottom = Math.max(last.bottom, rect.bottom);
    }

    return lines;
  }, []);
};

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
  footerEnabled = true,
  footerText = "页脚可以在这里编辑或删除",
  footerColor = "#C8A951",
}: PaginatedPreviewProps) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const editableRef = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState<PaginationState>({ offsets: [0], heights: [1] });
  const isEditingRef = useRef(false);

  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const padding = { x: fontSize * 1.6, y: fontSize * 1.8 };
  const footerH = footerEnabled ? FOOTER_HEIGHT : 0;
  const rawContentHeight = cardHeight - padding.y * 2 - footerH;
  const contentAreaHeight = Math.max(lineHeight, Math.floor(rawContentHeight));

  const paginate = useCallback(() => {
    const container = measureRef.current;
    if (!container) return;

    const totalH = container.scrollHeight;
    if (totalH <= 0) {
      setPagination({ offsets: [0], heights: [contentAreaHeight] });
      return;
    }

    const lines = getTextLineRects(container);

    if (lines.length === 0) {
      const pageCount = Math.max(1, Math.ceil(totalH / contentAreaHeight));
      setPagination({
        offsets: Array.from({ length: pageCount }, (_, i) => i * contentAreaHeight),
        heights: Array.from({ length: pageCount }, (_, i) =>
          i === pageCount - 1
            ? Math.max(lineHeight, Math.min(contentAreaHeight, totalH - i * contentAreaHeight))
            : contentAreaHeight
        ),
      });
      return;
    }

    // Strict whole-line pagination:
    // A line fits on the current page only if its ENTIRE height (bottom - pageOffset) <= contentAreaHeight.
    // If a line's bottom exceeds the page, that line starts a new page.
    const offsets: number[] = [0];
    const heights: number[] = [];
    let currentOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineBottom = line.bottom - currentOffset;

      // If this line's bottom exceeds the content area, start a new page at this line's top
      if (lineBottom > contentAreaHeight + PAGE_EPSILON && i > 0) {
        // Close current page: height is from currentOffset to the top of this overflowing line
        const pageH = Math.max(lineHeight, line.top - currentOffset);
        heights.push(Math.min(contentAreaHeight, pageH));

        // Start new page at this line's top
        currentOffset = line.top;
        offsets.push(currentOffset);
      }
    }

    // Close last page
    const lastPageH = Math.max(lineHeight, Math.min(contentAreaHeight, totalH - currentOffset));
    heights.push(lastPageH);

    setPagination({ offsets, heights });
  }, [contentAreaHeight, lineHeight]);

  useEffect(() => {
    const timer = setTimeout(paginate, 50);
    return () => clearTimeout(timer);
  }, [html, paginate, fontSize, cardWidth, cardHeight, footerEnabled]);

  useEffect(() => {
    if (editableRef.current && contentRef) {
      (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = editableRef.current;
    }
  });

  useEffect(() => {
    if (editableRef.current && !isEditingRef.current) {
      editableRef.current.innerHTML = html;
    }
  }, [html]);

  const handleInput = useCallback(() => {
    isEditingRef.current = true;
    onContentChange();
    requestAnimationFrame(() => {
      isEditingRef.current = false;
    });
  }, [onContentChange]);

  const handleFocus = useCallback(() => {
    isEditingRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isEditingRef.current = false;
  }, []);

  void directHtml;
  void markdown;

  return (
    <>
      <div
        ref={measureRef}
        className={`${templateClassName} markdown-body`}
        style={{
          position: "absolute",
          top: 0,
          left: -99999,
          visibility: "hidden",
          width: cardWidth - padding.x * 2,
          fontSize: `${fontSize}px`,
          textAlign: textAlign as React.CSSProperties["textAlign"],
          fontFamily: '"Noto Sans SC", system-ui, -apple-system, sans-serif',
          lineHeight: `${LINE_HEIGHT_RATIO}`,
          pointerEvents: "none",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          display: "flow-root",
          boxSizing: "border-box",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="flex flex-col items-center gap-6">
        {pagination.offsets.map((pageOffset, idx) => {
          const pageHeight = pagination.heights[idx] ?? contentAreaHeight;
          const totalPages = pagination.offsets.length;

          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              {totalPages > 1 && (
                <p className="text-[10px] text-muted-foreground">
                  {idx + 1} / {totalPages}
                </p>
              )}
              <div
                ref={(el) => {
                  cardRefs.current[idx] = el;
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
                  textAlign: textAlign as React.CSSProperties["textAlign"],
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  background: templateBackground,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <div
                  style={{
                    height: contentAreaHeight,
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      height: pageHeight,
                      overflow: "hidden",
                      position: "relative",
                      isolation: "isolate",
                    }}
                  >
                    {idx === 0 ? (
                      <div
                        ref={editableRef}
                        className="markdown-body"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(-${pageOffset}px)`,
                          transformOrigin: "top left",
                          display: "flow-root",
                          outline: "none",
                          cursor: "text",
                        }}
                      />
                    ) : (
                      <div
                        className="markdown-body"
                        dangerouslySetInnerHTML={{ __html: html }}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(-${pageOffset}px)`,
                          transformOrigin: "top left",
                          display: "flow-root",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </div>
                </div>
                {footerEnabled && (
                  <div
                    style={{
                      height: FOOTER_HEIGHT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      color: footerColor,
                      letterSpacing: "0.02em",
                      flexShrink: 0,
                      margin: `0 -${padding.x}px`,
                      padding: `0 ${padding.x}px`,
                    }}
                  >
                    <span style={{ opacity: 0.85 }}>
                      {footerText}
                    </span>
                    {totalPages > 1 && (
                      <span style={{ opacity: 0.7 }}>{idx + 1}/{totalPages}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PaginatedPreview;
