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
  disablePagination?: boolean;
}

interface PaginationState {
  offsets: number[];
  heights: number[];
}

const FOOTER_HEIGHT = 28;
const LINE_HEIGHT_RATIO = 2;
const PAGE_EPSILON = 1;

const getContentRects = (container: HTMLDivElement) => {
  const containerRect = container.getBoundingClientRect();
  const rects: Array<{ top: number; bottom: number }> = [];

  // 1. Collect text line rects
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });

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

  // 2. Also collect rects from non-text block elements (hr, img, canvas, svg, etc.)
  const blockEls = container.querySelectorAll("hr, img, canvas, svg, video, iframe");
  for (const el of Array.from(blockEls)) {
    const elRect = el.getBoundingClientRect();
    const top = elRect.top - containerRect.top;
    const bottom = elRect.bottom - containerRect.top;
    const style = window.getComputedStyle(el);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    if (bottom - top > 0) {
      rects.push({ top: top - marginTop, bottom: bottom + marginBottom });
    }
  }

  rects.sort((a, b) => a.top - b.top || a.bottom - b.bottom);

  return rects.reduce<Array<{ top: number; bottom: number }>>((lines, rect) => {
    const last = lines[lines.length - 1];

    // Merge by vertical overlap / near-overlap, not exact top/bottom.
    // This prevents the same visual line from being split into multiple entries
    // when it contains bold/italic spans with slightly different metrics.
    if (!last) {
      lines.push({ top: rect.top, bottom: rect.bottom });
      return lines;
    }

    const overlapsVertically = rect.top <= last.bottom - PAGE_EPSILON;
    const isNearSameLine = Math.abs(rect.top - last.top) <= 6;

    if (overlapsVertically || isNearSameLine) {
      last.top = Math.min(last.top, rect.top);
      last.bottom = Math.max(last.bottom, rect.bottom);
    } else {
      lines.push({ top: rect.top, bottom: rect.bottom });
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
  disablePagination = false,
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
  const contentTextStyle: React.CSSProperties = {
    width: "100%",
    fontSize: `${fontSize}px`,
    lineHeight: `${LINE_HEIGHT_RATIO}`,
    textAlign: textAlign as React.CSSProperties["textAlign"],
    fontFamily: '"Noto Sans SC", system-ui, -apple-system, sans-serif',
    wordBreak: "break-word",
    overflowWrap: "break-word",
    display: "flow-root",
    boxSizing: "border-box",
  };

  const paginate = useCallback(() => {
    const container = measureRef.current;
    if (!container) return;

    const totalH = Math.ceil(container.scrollHeight);
    if (totalH <= 0) {
      setPagination({ offsets: [0], heights: [contentAreaHeight] });
      return;
    }

    if (disablePagination) {
      setPagination({ offsets: [0], heights: [Math.max(lineHeight, totalH)] });
      return;
    }

    const lines = getContentRects(container)
      .map((line) => ({
        top: Math.max(0, Math.floor(line.top)),
        bottom: Math.max(0, Math.ceil(line.bottom)),
      }))
      .filter((line) => line.bottom > line.top)
      .sort((a, b) => a.top - b.top || a.bottom - b.bottom);

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

    const offsets: number[] = [];
    const heights: number[] = [];
    let pageStart = 0;
    let index = 0;

    while (pageStart < totalH - PAGE_EPSILON) {
      while (index < lines.length && lines[index].bottom <= pageStart + PAGE_EPSILON) {
        index += 1;
      }

      offsets.push(pageStart);

      let pageEnd = pageStart;
      let cursor = index;

      while (cursor < lines.length) {
        const line = lines[cursor];

        if (line.top < pageStart + PAGE_EPSILON) {
          cursor += 1;
          continue;
        }

        if (line.bottom - pageStart <= contentAreaHeight + PAGE_EPSILON) {
          pageEnd = Math.max(pageEnd, line.bottom);
          cursor += 1;
          continue;
        }

        break;
      }

      if (pageEnd <= pageStart + PAGE_EPSILON) {
        pageEnd = Math.min(totalH, pageStart + contentAreaHeight);
      }

      const clampedPageEnd = Math.min(totalH, pageEnd);
      heights.push(Math.max(lineHeight, clampedPageEnd - pageStart));

      if (clampedPageEnd >= totalH - PAGE_EPSILON) {
        break;
      }

      pageStart = clampedPageEnd;
      index = cursor;
    }

    setPagination({ offsets, heights });
  }, [contentAreaHeight, disablePagination, lineHeight]);

  useEffect(() => {
    const timer = setTimeout(paginate, 50);
    return () => clearTimeout(timer);
  }, [html, paginate, fontSize, cardWidth, cardHeight, footerEnabled, disablePagination]);

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
          pointerEvents: "none",
          ...contentTextStyle,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="flex flex-col items-center gap-6">
        {pagination.offsets.map((pageOffset, idx) => {
          const pageHeight = pagination.heights[idx] ?? contentAreaHeight;
          const totalPages = pagination.offsets.length;
          // Use the exact slice height for this page to prevent overlap/duplication
          const nextOffset = idx < totalPages - 1 ? pagination.offsets[idx + 1] : pageOffset + pageHeight;
          const sliceHeight = Math.min(contentAreaHeight, nextOffset - pageOffset);
          const renderedContentHeight = disablePagination ? pageHeight : sliceHeight;
          const renderedCardHeight = disablePagination
            ? pageHeight + padding.y * 2 + footerH
            : cardHeight;

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
                  height: renderedCardHeight,
                  fontFamily: '"Noto Sans SC", system-ui, -apple-system, sans-serif',
                  fontSize: `${fontSize}px`,
                  lineHeight: `${LINE_HEIGHT_RATIO}`,
                  padding: `${padding.y}px ${padding.x}px`,
                  borderRadius: 0,
                  boxSizing: "border-box",
                  textAlign: textAlign as React.CSSProperties["textAlign"],
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: templateBackground,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <div
                  style={{
                    height: renderedContentHeight,
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      height: renderedContentHeight,
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
                          onWheel={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            transform: `translateY(-${pageOffset}px)`,
                            transformOrigin: "top left",
                            outline: "none",
                            cursor: "text",
                            ...contentTextStyle,
                          }}
                        />
                      ) : (
                        <div
                          className="markdown-body"
                          dangerouslySetInnerHTML={{ __html: html }}
                          onWheel={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            transform: `translateY(-${pageOffset}px)`,
                            transformOrigin: "top left",
                            pointerEvents: "none",
                            ...contentTextStyle,
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
                    <span style={{ opacity: 0.85 }}>{footerText}</span>
                    {totalPages > 1 && (
                      <span style={{ opacity: 0.7 }}>
                        {idx + 1}/{totalPages}
                      </span>
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
