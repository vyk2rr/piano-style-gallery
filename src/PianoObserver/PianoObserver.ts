import type { tChord, tNoteWithOctave } from "../PianoBase/PianoBase.types";

type PianoEvent = 
  | { type: "notePlayed", note: tNoteWithOctave }
  | { type: "chordPlayed", chord: tChord }
  | { type: "sequenceEnded" };

type Listener = (event: PianoEvent) => void;

export class PianoObserver {
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    // Devuelve función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event: PianoEvent) {
    this.listeners.forEach(listener => listener(event));
  }
}