import { useState, useCallback, useRef } from "react";

const MAX_HISTORY = 100;

export function useHistory(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  const historyRef = useRef<string[]>([initialValue]);
  const indexRef = useRef(0);

  const push = useCallback((newValue: string) => {
    const history = historyRef.current;
    const idx = indexRef.current;

    // Trim future states
    historyRef.current = history.slice(0, idx + 1);
    historyRef.current.push(newValue);

    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      indexRef.current = historyRef.current.length - 1;
    }

    setValue(newValue);
  }, []);

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      setValue(historyRef.current[indexRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      setValue(historyRef.current[indexRef.current]);
    }
  }, []);

  const reset = useCallback((newValue: string) => {
    historyRef.current = [newValue];
    indexRef.current = 0;
    setValue(newValue);
  }, []);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  return { value, push, undo, redo, reset, canUndo, canRedo };
}
