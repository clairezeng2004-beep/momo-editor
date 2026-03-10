import { useState, useCallback } from "react";
import type { TemplateStyle } from "@/lib/templates";

const STORAGE_KEY = "custom-templates";

export interface CustomTemplate extends TemplateStyle {
  isCustom: true;
  textColor: string;
  headingColor: string;
  defaultFontSize: number;
}

function loadCustomTemplates(): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomTemplates(templates: CustomTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function useCustomTemplates() {
  const [templates, setTemplates] = useState<CustomTemplate[]>(loadCustomTemplates);

  const addTemplate = useCallback((t: CustomTemplate) => {
    setTemplates((prev) => {
      const next = [...prev, t];
      saveCustomTemplates(next);
      return next;
    });
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<CustomTemplate>) => {
    setTemplates((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveCustomTemplates(next);
      return next;
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveCustomTemplates(next);
      return next;
    });
  }, []);

  return { templates, addTemplate, updateTemplate, deleteTemplate };
}
