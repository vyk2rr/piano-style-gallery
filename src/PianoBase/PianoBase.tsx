import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);
import React, { useEffect, useImperativeHandle, forwardRef } from "react";
import { generateNotes, getAlternativeNotation, getBlackKeyLeft, getBlackKeyWidth } from "./PianoBase.utils";
import type { tChord, tOctaveRange, tNoteWithOctave, tSequenceToPlayProps, iChordEvent, tMelodySequence } from "./PianoBase.types";
import type { PianoObserver } from "../PianoObserver/PianoObserver";
import useHighlight from "../hooks/useHighlight/useHighlight";
import useToneJs from "../hooks/useToneJs/useToneJs";
import type { SupportedSynthType } from "../hooks/useToneJs/useToneJs";

export interface PianoBaseProps {
  octave?: tOctaveRange;
  octaves?: tOctaveRange;
  highlightOnThePiano?: tChord;
  sequenceToPlay?: tSequenceToPlayProps;
  pianoObservable?: PianoObserver;
  className?: string;
  renderUI?: (params: any) => React.ReactNode;
  createSynth?: () => SupportedSynthType;
}

export type PianoBaseHandle = {

  handleMelodyEvent: (event: iChordEvent) => void;
  scheduleMelody: (
    sequence: tMelodySequence,
    onEventCallback: (event: iChordEvent) => void,
    onComplete?: () => void
  ) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  isReady: boolean;
  startTone: () => Promise<void>;
  playArpeggio: (chord: tChord, duration?: string, interval?: string, velocity?: number) => Promise<void>;
  playChord: (chord: tChord, duration?: string, time?: string, velocity?: number) => Promise<void>;
};

const PianoBase = forwardRef<PianoBaseHandle, PianoBaseProps>(({
  octave = 4,
  octaves = 3,
  highlightOnThePiano,
  pianoObservable,
  className,
  renderUI,
  createSynth,
}, ref) => {
  const { white, black } = generateNotes(octaves, octave);

  const {
    highlightNoteInGroup,
    highlightClickedNote,
    clearGroupHighlights,
    isNoteClicked,
    isNoteInGroup,
  } = useHighlight();

  const {
    isReady,
    start: startTone,
    play,
    pause,
    stop,
    scheduleMelody,
    playNote,
    durationToMs,
    playArpeggio,
    playChord,
  } = useToneJs({ bpm: 200, createSynth });

  useEffect(() => {
    clearGroupHighlights(0);
    if (highlightOnThePiano) {
      (Array.isArray(highlightOnThePiano) ? highlightOnThePiano : [highlightOnThePiano])
        .forEach(note => {
          playNote(note, "4n", undefined, 0.7);
          // Efecto jelly:
          const idx = white.findIndex(n => n === note);
          if (idx !== -1) {
            animateWobble(bottomRefs.current[idx]);
            if (idx > 0) animateNeighborNudge(bottomRefs.current[idx - 1], -1);
            if (idx < white.length - 1) animateNeighborNudge(bottomRefs.current[idx + 1], 1);
          }
          highlightNoteInGroup(note, Infinity, 0)
        });
    }
  }, [highlightOnThePiano, highlightNoteInGroup, clearGroupHighlights]);

  const handleMelodyEvent = (event: iChordEvent) => {
    const { pitches, duration, highlightGroup } = event;
    if (!pitches || pitches.length === 0 || !durationToMs) return;
    pianoObservable?.notify({ type: "chordPlayed", chord: pitches });
    if (highlightGroup !== undefined) {
      const visualDurationMs = durationToMs(duration) + 80;
      pitches.forEach(note => {
        highlightNoteInGroup(note, visualDurationMs, highlightGroup - 1);
      });
    }
  };

  const handlePianoKeyClick = (note: tNoteWithOctave) => {
    highlightClickedNote(note, 180);
    playNote(note);
    pianoObservable?.notify({ type: "notePlayed", note });
  };

  useImperativeHandle(ref, () => ({
    handleMelodyEvent,
    scheduleMelody,
    play,
    pause,
    stop,
    isReady,
    startTone,
    playArpeggio,
    playChord
  }));

  const pianoContainer = useRef<HTMLDivElement>(null);
  const bottomRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {}, { scope: pianoContainer });

  const animateWobble = (el: HTMLDivElement | null) => {
    if (!el) return;
    gsap.fromTo(el,
      { scaleX: 1, scaleY: 1, x: 0, transformOrigin: 'top center' },
      {
        scaleX: 1.18,
        scaleY: 0.82,
        x: gsap.utils.random(-10, 10),
        transformOrigin: 'top center',
        duration: 0.13,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
        onComplete: () => {
          gsap.to(el, {
            scaleX: 0.92,
            scaleY: 1.12,
            x: gsap.utils.random(-6, 6),
            transformOrigin: 'top center',
            duration: 0.12,
            yoyo: true,
            repeat: 1,
            ease: "power1.inOut",
            clearProps: "scaleX,scaleY,x,transformOrigin"
          });
        }
      }
    );
  };

  const animateNeighborNudge = (el: HTMLDivElement | null, direction: -1 | 1) => {
    if (!el) return;
    gsap.fromTo(el,
      { x: 0, transformOrigin: 'top center' },
      {
        x: direction * gsap.utils.random(8, 14),
        transformOrigin: 'top center',
        duration: 0.11,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
        onComplete: () => {
          gsap.to(el, {
            x: 0,
            transformOrigin: 'top center',
            duration: 0.13,
            ease: "power1.inOut",
            clearProps: "x,transformOrigin"
          });
        }
      }
    );
  };

  return (
    <div ref={pianoContainer} className={`piano-base ${className || ''}`} data-testid="piano-base">
      {renderUI ? renderUI({
        white,
        black,
        octaves,
        octave,
        handlePianoKeyClick,
        isNoteActive: (note: tNoteWithOctave) => ({
          clicked: isNoteClicked(note),
          group1: isNoteInGroup(note, 0),
          group2: isNoteInGroup(note, 1)
        }),
        getBlackKeyLeft: (note: tNoteWithOctave, whiteKeys: tChord) => getBlackKeyLeft(note, whiteKeys),
        getBlackKeyWidth: (octaves: tOctaveRange) => getBlackKeyWidth(octaves),
        getAlternativeNotation,
      }) : (
        <div className="piano">
          <div className="white-keys">
            {white.map((note, idx) => {
              const clicked = isNoteClicked(note);
              const group1 = isNoteInGroup(note, 0);
              const group2 = isNoteInGroup(note, 1);
              const handleKeyClick = () => {
                animateWobble(bottomRefs.current[idx]);
                if (idx > 0) animateNeighborNudge(bottomRefs.current[idx - 1], -1);
                if (idx < white.length - 1) animateNeighborNudge(bottomRefs.current[idx + 1], 1);
                handlePianoKeyClick(note);
              };
              return (
                <div
                  key={note}
                  className={`white-key${clicked ? " active-key" : ""}${group1 ? " highlight-group-1" : ""}${group2 ? " highlight-group-2" : ""}`}
                  data-note={note}
                  onClick={handleKeyClick}
                  style={{ position: 'relative', overflow: 'visible' }}
                >
                  <div className="white-key-top" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '40%', pointerEvents: 'none', zIndex: 2 }} />
                  <div
                    ref={el => { bottomRefs.current[idx] = el; }}
                    className="white-key-bottom"
                    style={{ position: 'absolute', top: '40%', left: 0, width: '100%', height: '60%', zIndex: 1, transformOrigin: 'top center' }}
                  >
                    <div className="circle">
                      <div className="inner-circle"></div>
                    </div>
                    {(group1 || group2 || note.startsWith('C')) && <span className="note-name">{note}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="black-keys">
            {black.map(noteString => {
              const clicked = isNoteClicked(noteString);
              const group1 = isNoteInGroup(noteString, 0);
              const group2 = isNoteInGroup(noteString, 1);
              return (
                <div
                  key={noteString}
                  className={`black-key${clicked ? " active-key" : ""}${group1 ? " highlight-group-1" : ""}${group2 ? " highlight-group-2" : ""}`}
                  style={{
                    pointerEvents: "all",
                    left: getBlackKeyLeft(noteString, white),
                    width: getBlackKeyWidth(octaves)
                  }}
                  data-note={noteString}
                  onClick={() => handlePianoKeyClick(noteString)}
                >
                  {(group1 || group2) && (
                    <span className="note-name">
                      <span className="flat-notation">{getAlternativeNotation(noteString)}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default PianoBase;
