import { useState, useEffect, useCallback, useRef } from 'react';
import type { RefObject } from 'react';
import * as Tone from 'tone';
import type {
  tNoteWithOctave,
  tChord,
  tTime,
  iChordEvent, // Importar este tipo
  tMelodySequence // Importar este tipo
} from '../../PianoBase/PianoBase.types';

// Solo PolySynth como tipo soportado
export type SupportedSynthType = Tone.PolySynth;
export type tMelodyEventCallback = (event: iChordEvent) => void;

interface ToneJsHookOptions {
  createSynth?: () => SupportedSynthType;
  onReady?: () => void;
  bpm?: number;
}

interface iToneJsHookReturn {
  isReady: boolean;
  start: () => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  playNote: (note: tNoteWithOctave, duration?: tTime, time?: Tone.Unit.Time, velocity?: number) => Promise<void>;
  playChord: (chord: tChord, duration?: tTime, time?: Tone.Unit.Time, velocity?: number) => Promise<void>;
  playArpeggio: (chord: tChord, duration?: tTime, interval?: tTime, velocity?: number) => Promise<void>;
  synthRef: RefObject<SupportedSynthType | null>;
  cancelScheduledEvents: () => void;
  setMasterVolume: (volume: number) => void;
  durationToMs: (duration: Tone.Unit.Time) => number;
  setBpm: (bpm: number) => void;
  scheduleMelody: (
    sequence: tMelodySequence,
    onEventCallback: tMelodyEventCallback,
    onComplete?: () => void
  ) => void;
}

export default function useToneJs({
  createSynth,
  onReady,
  bpm = 120
}: ToneJsHookOptions = {}): iToneJsHookReturn {
  const [isReady, setIsReady] = useState<boolean>(false);
  const synthRef = useRef<SupportedSynthType | null>(null);
  const transportRef = useRef<ReturnType<typeof Tone.getTransport> | null>(null);
  const destinationRef = useRef<ReturnType<typeof Tone.getDestination> | null>(null);
  const partRef = useRef<Tone.Part<iChordEvent> | null>(null);
  const onCompleteRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    transportRef.current = Tone.getTransport();
    destinationRef.current = Tone.getDestination();
    if (transportRef.current) {
      transportRef.current.bpm.value = bpm;
    }

    // Siempre PolySynth
    const synth = createSynth
      ? createSynth()
      : new Tone.PolySynth(Tone.Synth).connect(destinationRef.current);

    synthRef.current = synth;

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      if (partRef.current) {
        partRef.current.dispose();
        partRef.current = null;
      }
      if (transportRef.current) {
        transportRef.current.stop();
        transportRef.current.cancel();
      }
    };
  }, [createSynth, bpm]);

  const start = useCallback(async () => {
    try {
      await Tone.start();
      if (transportRef.current) {
        transportRef.current.start();
      }
      setIsReady(true);
      onReady?.();
      return Promise.resolve();
    } catch (error) {
      console.error("Error iniciando Tone.js:", error);
      return Promise.reject(error);
    }
  }, [onReady]);

  const transportStop = useCallback(() => {
    if (transportRef.current) {
      transportRef.current.stop();
      transportRef.current.cancel();
      transportRef.current.position = 0;
    }
    if (partRef.current) {
      partRef.current.stop();
    }
  }, []);

  // PolySynth: acepta nota o arreglo de notas
  const playNote = useCallback(async (
    note: tNoteWithOctave,
    duration: tTime = "8n",
    time?: Tone.Unit.Time,
    velocity: number = 0.7
  ): Promise<void> => {
    if (!synthRef.current) return Promise.resolve();

    if (time) {
      synthRef.current.triggerAttackRelease(note, duration, time, velocity);
      return Promise.resolve();
    } else {
      synthRef.current.triggerAttackRelease(note, duration, undefined, velocity);
      const ms = Tone.Time(duration).toMilliseconds();
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }, []);

  const playChord = useCallback(async (
    chord: tChord,
    duration: tTime = "4n",
    time?: Tone.Unit.Time,
    velocity: number = 0.7
  ): Promise<void> => {
    if (!synthRef.current || chord.length === 0) return Promise.resolve();

    synthRef.current.triggerAttackRelease(chord, duration, time, velocity);
    const ms = Tone.Time(duration).toMilliseconds();
    if (!time) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    return Promise.resolve();
  }, []);

  const playArpeggio = useCallback(async (
    chord: tChord,
    duration: tTime = "8n",
    interval: tTime = "16n",
    velocity: number = 0.7
  ): Promise<void> => {
    if (!synthRef.current || chord.length === 0) return Promise.resolve();

    for (let i = 0; i < chord.length; i++) {
      const note = chord[i];
      synthRef.current.triggerAttackRelease(note, duration, undefined, velocity);
      if (i < chord.length - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, Tone.Time(interval).toMilliseconds())
        );
      }
    }
    const durationMs = Tone.Time(duration).toMilliseconds();
    return new Promise(resolve => setTimeout(resolve, durationMs));
  }, []);

  const scheduleMelody = useCallback(
    (
      sequence: tMelodySequence,
      onEventCallback: tMelodyEventCallback,
      onComplete?: () => void
    ) => {
      // Limpiar la parte anterior y los eventos del transporte
      if (partRef.current) {
        partRef.current.dispose();
        partRef.current = null;
      }
      if (transportRef.current) {
        transportRef.current.stop();
        transportRef.current.cancel();
        transportRef.current.position = 0;
      }
      onCompleteRef.current = onComplete;

      if (!synthRef.current || sequence.length === 0) return;

      // Crear la parte
      const part = new Tone.Part<iChordEvent>((time, event) => {
        synthRef.current?.triggerAttackRelease(
          event.pitches,
          event.duration,
          time,
          event.velocity
        );
        onEventCallback({ ...event, scheduledPlayTime: time });
      }, sequence);

      partRef.current = part;
      part.start(0);

      // Calcular el tiempo de finalización real
      const lastEvent = sequence[sequence.length - 1];
      const lastTime = Tone.Time(lastEvent.time).toSeconds();
      const lastDuration = Tone.Time(lastEvent.duration).toSeconds();
      const endTime = lastTime + lastDuration + 0.05; // pequeño margen

      // Programar el callback de finalización
      Tone.getTransport().scheduleOnce(() => {
        onCompleteRef.current?.();
        transportStop();
      }, endTime);
    },
    [transportStop]
  );

  const play = useCallback(() => {
    Tone.getTransport().start();
  }, []);

  const pause = useCallback(() => {
    Tone.getTransport().pause();
  }, []);

  const cancelScheduledEvents = useCallback(() => {
    if (transportRef.current) {
      transportRef.current.cancel();
    }
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    if (destinationRef.current) {
      destinationRef.current.volume.value = volume;
    }
  }, []);

  const setBpm = useCallback((newBpm: number) => {
    if (transportRef.current) {
      transportRef.current.bpm.value = newBpm;
    }
  }, []);

  const durationToMs = (duration: Tone.Unit.Time): number => Tone.Time(duration).toMilliseconds();

  return {
    isReady,
    start,
    play,
    pause,
    stop: transportStop,
    playNote,
    playChord,
    playArpeggio,
    synthRef,
    cancelScheduledEvents,
    setMasterVolume,
    durationToMs,
    setBpm,
    scheduleMelody
  };
}