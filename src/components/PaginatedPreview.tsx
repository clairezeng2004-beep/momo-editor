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
}

const FOOTER_HEIGHT = 28;
const LINE_HEIGHT_RATIO = 2;

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
  const editableRef = useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = useState(1);
  const isEditingRef = useRef(false);

  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const padding = { x: fontSize * 1.6, y: fontSize * 1.8 };
  const rawContentHeight = cardHeight - padding.y * 2 - FOOTER_HEIGHT;
  const contentHeight = Math.max(lineHeight, Math.floor(rawContentHeight / lineHeight) * lineHeight);

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
        {Array.from({ length: totalPages }, (_, idx) => {
          const pageOffset = idx * contentHeight;

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
                    flex: 1,
                    height: contentHeight,
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
                    paddingTop: 10,
                    margin: `0 -${padding.x}px`,
                    padding: `0 ${padding.x}px`,
                  }}
                >
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    style={{ opacity: 0.85, outline: "none", cursor: "text" }}
                  >
                    页脚可以在这里编辑或删除
                  </span>
                  {totalPages > 1 && (
                    <span style={{ opacity: 0.7 }}>{idx + 1}/{totalPages}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PaginatedPreview;
