import { useState, useCallback } from "react";
import type { tNoteWithOctave } from "../../PianoBase/PianoBase.types";

interface iActiveNoteInfo {
  note: tNoteWithOctave;
  releaseTime: number;
  highlightGroup?: number;
}

interface UseHighlightOptions {
  groupCount?: number;
}

/**
 * Hook para gestionar el resaltado de notas musicales en interfaces visuales
 */
export default function useHighlight(options: UseHighlightOptions = {}) {
  const { groupCount = 2 } = options;

  const [clickedNotes, setClickedNotes] = useState<iActiveNoteInfo[]>([]);
  const [highlightGroups, setHighlightGroups] = useState<iActiveNoteInfo[][]>(
    Array(groupCount).fill(null).map(() => [])
  );

  // Reinicializa los grupos si cambia groupCount
  // (opcional: puedes mejorar esto si groupCount puede cambiar dinámicamente)

  const highlightNoteInGroup = useCallback((
    note: tNoteWithOctave,
    durationMs: number = Infinity,
    highlightGroup?: number
  ) => {
    if (highlightGroup === undefined || highlightGroup < 0 || highlightGroup >= groupCount) return;

    const newHighlightEntry: iActiveNoteInfo = {
      note,
      releaseTime: durationMs === Infinity ? Infinity : performance.now() + durationMs,
      highlightGroup,
    };

    setHighlightGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[highlightGroup] = [...newGroups[highlightGroup], newHighlightEntry];
      return newGroups;
    });

    if (durationMs !== Infinity) {
      setTimeout(() => {
        setHighlightGroups(prevGroups => {
          const newGroups = [...prevGroups];
          newGroups[highlightGroup] = newGroups[highlightGroup].filter(n => n.note !== note);
          return newGroups;
        });
      }, durationMs);
    }
  }, [groupCount]);

  const highlightClickedNote = useCallback((note: tNoteWithOctave, durationMs: number = 180) => {
    setClickedNotes(prev => [...prev, {
      note,
      releaseTime: performance.now() + durationMs
    }]);
    setTimeout(() => {
      setClickedNotes(prev => prev.filter(item => item.note !== note));
    }, durationMs);
  }, []);

  const clearAllHighlights = useCallback(() => {
    setClickedNotes([]);
    setHighlightGroups(prevGroups => prevGroups.map(() => []));
  }, []);

  const clearGroupHighlights = useCallback((groupIndex: number) => {
    if (groupIndex < 0 || groupIndex >= groupCount) return;
    setHighlightGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex] = [];
      return newGroups;
    });
  }, [groupCount]);

  const isNoteClicked = (note: tNoteWithOctave) =>
    clickedNotes.some(cn => cn.note === note);

  const isNoteInGroup = (note: tNoteWithOctave, groupIndex: number) => {
    if (groupIndex < 0 || groupIndex >= groupCount) return false;
    return highlightGroups[groupIndex].some(hk => hk.note === note);
  };

  return {
    // Métodos para resaltar
    highlightNoteInGroup,
    highlightClickedNote,
    clearAllHighlights,
    clearGroupHighlights,

    // Métodos para verificar estado
    isNoteClicked,
    isNoteInGroup,

    // Estado
    clickedNotes,
    highlightGroups
  };
}