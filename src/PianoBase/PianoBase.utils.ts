import * as Tone from "tone";
import type {
  tOctaveRange, tChordMap, 
  tNoteWithOctave, tPianoNotes, tPercentString,
  tNoteName,
} from "./PianoBase.types";
import { SHARP_TO_FLAT_MAP } from "./PianoBase.types";
import type { SupportedSynthType } from "../hooks/useToneJs/useToneJs";

export const DEFAULT_CHORD_MAP: tChordMap = {
  D4maj: ["D4", "A4", "F#5", "A5", "D6"],
  E4min: ["E4", "B4", "G5", "B5", "E6"],
  G4bmin: ["F#4", "C#5", "A5", "C#6", "F#6"],
  G4maj: ["G4", "D5", "B5", "D6", "G6"],
  A4maj: ["A4", "E5", "C#6", "E6", "A6"],
  B4min: ["B4", "F#5", "D6", "F#6", "B6"],
  C4dim: ["C#5", "G5", "E6", "G6", "C#7"],
  D5maj: ["D5", "A5", "F#6", "A6", "D7"],
};

export function generateNotes(octaves: tOctaveRange = 3, startOctave: tOctaveRange = 4): tPianoNotes {
  const white: tNoteWithOctave[] = [];
  const black: tNoteWithOctave[] = [];

  for (let i = 0; i < octaves; i++) {
    const currentOctave = startOctave + i;
    white.push(...["C", "D", "E", "F", "G", "A", "B"].map(n => `${n}${currentOctave}` as tNoteWithOctave));
    black.push(...["C#", "D#", "F#", "G#", "A#"].map(n => `${n}${currentOctave}` as tNoteWithOctave));
  }

  // Agrega la nota final del último do (ej. C6)
  white.push(`C${startOctave + octaves}` as tNoteWithOctave);

  return { white, black };
}

export function getAlternativeNotation(note: tNoteWithOctave): tNoteWithOctave {
  const match = note.match(/^([A-G]#)(\d)$/);
  if (match) {
    const [, noteName, octave] = match;
    const flat = SHARP_TO_FLAT_MAP[noteName as keyof typeof SHARP_TO_FLAT_MAP];
    if (flat) {
      return `${flat}${octave}` as tNoteWithOctave;
    }
  }
  return "" as tNoteWithOctave;
}

export function getBlackKeyLeft(note: tNoteWithOctave, whiteNotes: tNoteWithOctave[]): tPercentString {
  const blackToWhiteBefore: Partial<Record<tNoteName, tNoteName>> = {
    "C#": "C",
    "D#": "D",
    "F#": "F",
    "G#": "G",
    "A#": "A",
  };

  const match = note.match(/^([A-G]#)(\d)$/);
  if (!match) return "0%";
  const [_, pitchClass, octave] = match;
  const whiteBefore = `${blackToWhiteBefore[pitchClass as tNoteName]}${octave}` as tNoteWithOctave;
  const whiteIndex = whiteNotes.indexOf(whiteBefore); // falta la octava en whiteBefore

  if (whiteIndex === -1) return "0%";
  const whiteKeyWidth = 100 / whiteNotes.length;
  const left = (whiteIndex + 1) * whiteKeyWidth;

  return `${left}%`; // ya está centrado por transform: translateX(-50%)
}

export function getBlackKeyWidth(octaves: tOctaveRange): tPercentString {
  if (octaves <= 1) return "7%";
  if (octaves === 2) return "4%";
  if (octaves === 3) return "3%";
  if (octaves === 4) return "2%";
  return "1.4%";
}

export function createDefaultSynth(): SupportedSynthType {
  // Sintetizador principal para el tono del piano
  const synth = new Tone.PolySynth(Tone.Synth, {
    volume: -8,
    envelope: {
      attack: 0.002,    // Ataque muy rápido para el golpe de martillo
      decay: 0.5,       // Decay moderado
      sustain: 0.15,    // Sustain bajo para simular las cuerdas del piano
      release: 1.5      // Release largo para la resonancia natural
    },
    oscillator: {
      type: "sine"      // Onda sinusoidal para un tono más puro
    }
  });

  // Filtro para dar forma al sonido del piano
  const filter = new Tone.Filter({
    type: "lowpass",
    frequency: 5000,    // Frecuencia de corte alta para mantener brillo
    Q: 1               // Resonancia suave
  });

  // Compressor para controlar la dinámica
  const compressor = new Tone.Compressor({
    threshold: -20,
    ratio: 3,
    attack: 0.003,
    release: 0.25
  });

  // Reverb sutil para simular la caja de resonancia del piano
  const reverb = new Tone.Reverb({
    decay: 1.5,        // Decay moderado
    wet: 0.2          // Mezcla sutil
  }).toDestination();

  // Conectamos la cadena de efectos
  synth.chain(filter, compressor, reverb);

  // Retornamos un objeto compatible con la interfaz esperada
  return {
    triggerAttackRelease(note: string | string[], duration: string | number): void {
      synth.triggerAttackRelease(note, duration);
    },
    dispose() {
      synth.dispose();
      filter?.dispose();
      compressor?.dispose();
      reverb?.dispose();
    }
  } as unknown as Tone.PolySynth;
}

