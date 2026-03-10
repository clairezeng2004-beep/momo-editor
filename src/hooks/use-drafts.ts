import { useState, useEffect, useCallback } from "react";

export interface Draft {
  id: string;
  title: string;
  markdown: string;
  templateId: string;
  ratioId: string;
  fontSize: number;
  updatedAt: number;
}

const DRAFTS_KEY = "card-maker-drafts";
const CURRENT_DRAFT_KEY = "card-maker-current-draft";

function loadDrafts(): Draft[] {
  try {
    const v = localStorage.getItem(DRAFTS_KEY);
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: Draft[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

function extractTitle(markdown: string): string {
  const firstLine = markdown.split("\n").find((l) => l.trim().length > 0) ?? "";
  return firstLine.replace(/^#+\s*/, "").slice(0, 30) || "未命名草稿";
}

export function useDrafts(defaultMarkdown: string) {
  const [drafts, setDrafts] = useState<Draft[]>(loadDrafts);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_DRAFT_KEY);
    } catch {
      return null;
    }
  });

  // Save drafts to localStorage whenever they change
  useEffect(() => {
    saveDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    if (currentDraftId) {
      localStorage.setItem(CURRENT_DRAFT_KEY, currentDraftId);
    } else {
      localStorage.removeItem(CURRENT_DRAFT_KEY);
    }
  }, [currentDraftId]);

  const getCurrentDraft = useCallback((): Draft | undefined => {
    return drafts.find((d) => d.id === currentDraftId);
  }, [drafts, currentDraftId]);

  const updateDraft = useCallback(
    (markdown: string, templateId: string, ratioId: string, fontSize: number) => {
      if (!currentDraftId) return;
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === currentDraftId
            ? { ...d, markdown, templateId, ratioId, fontSize, title: extractTitle(markdown), updatedAt: Date.now() }
            : d
        )
      );
    },
    [currentDraftId]
  );

  const createDraft = useCallback(
    (markdown?: string, templateId = "apple-notes", ratioId = "3:4", fontSize = 15): string => {
      const id = crypto.randomUUID();
      const content = markdown ?? defaultMarkdown;
      const draft: Draft = {
        id,
        title: extractTitle(content),
        markdown: content,
        templateId,
        ratioId,
        fontSize,
        updatedAt: Date.now(),
      };
      setDrafts((prev) => [draft, ...prev]);
      setCurrentDraftId(id);
      return id;
    },
    [defaultMarkdown]
  );

  const deleteDraft = useCallback(
    (id: string) => {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (currentDraftId === id) {
        setCurrentDraftId(null);
      }
    },
    [currentDraftId]
  );

  const switchDraft = useCallback((id: string) => {
    setCurrentDraftId(id);
  }, []);

  return {
    drafts,
    currentDraftId,
    getCurrentDraft,
    updateDraft,
    createDraft,
    deleteDraft,
    switchDraft,
  };
}
