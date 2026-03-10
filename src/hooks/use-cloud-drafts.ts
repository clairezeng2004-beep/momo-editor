import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDefaultMarkdown } from "@/components/DefaultMarkdownEditor";

export interface Draft {
  id: string;
  title: string;
  markdown: string;
  templateId: string;
  ratioId: string;
  fontSize: number;
  updatedAt: number;
}

function extractTitle(markdown: string): string {
  const firstLine = markdown.split("\n").find((l) => l.trim().length > 0) ?? "";
  return firstLine.replace(/^#+\s*/, "").slice(0, 30) || "未命名草稿";
}

export function useCloudDrafts(defaultMarkdown: string) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load drafts from cloud
  useEffect(() => {
    if (!user) { setDrafts([]); setCurrentDraftId(null); setLoaded(false); return; }

    const load = async () => {
      const { data } = await supabase
        .from("drafts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (data && data.length > 0) {
        const mapped: Draft[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          markdown: d.markdown,
          templateId: d.template_id,
          ratioId: d.ratio_id,
          fontSize: d.font_size,
          updatedAt: new Date(d.updated_at).getTime(),
        }));
        setDrafts(mapped);
        setCurrentDraftId(mapped[0].id);
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const getCurrentDraft = useCallback((): Draft | undefined => {
    return drafts.find((d) => d.id === currentDraftId);
  }, [drafts, currentDraftId]);

  const updateDraft = useCallback(
    (markdown: string, templateId: string, ratioId: string, fontSize: number) => {
      if (!currentDraftId || !user) return;
      const title = extractTitle(markdown);
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === currentDraftId
            ? { ...d, markdown, templateId, ratioId, fontSize, title, updatedAt: Date.now() }
            : d
        )
      );

      // Debounced cloud save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        await supabase.from("drafts").update({
          markdown,
          template_id: templateId,
          ratio_id: ratioId,
          font_size: fontSize,
          title,
          updated_at: new Date().toISOString(),
        }).eq("id", currentDraftId);
      }, 1000);
    },
    [currentDraftId, user]
  );

  const createDraft = useCallback(
    async (markdown?: string, templateId = "apple-notes", ratioId = "3:4", fontSize = 15): Promise<string> => {
      if (!user) return "";
      // Always read the latest default at call time
      const content = markdown ?? (() => {
        try {
          const saved = localStorage.getItem("card-maker-default-markdown");
          if (saved !== null) return saved;
        } catch {}
        return defaultMarkdown;
      })();
      const title = extractTitle(content);

      const { data } = await supabase.from("drafts").insert({
        user_id: user.id,
        title,
        markdown: content,
        template_id: templateId,
        ratio_id: ratioId,
        font_size: fontSize,
      }).select().single();

      if (data) {
        const draft: Draft = {
          id: data.id,
          title: data.title,
          markdown: data.markdown,
          templateId: data.template_id,
          ratioId: data.ratio_id,
          fontSize: data.font_size,
          updatedAt: new Date(data.updated_at).getTime(),
        };
        setDrafts((prev) => [draft, ...prev]);
        setCurrentDraftId(data.id);
        return data.id;
      }
      return "";
    },
    [user, defaultMarkdown]
  );

  const deleteDraft = useCallback(
    async (id: string) => {
      await supabase.from("drafts").delete().eq("id", id);
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
    loaded,
  };
}
