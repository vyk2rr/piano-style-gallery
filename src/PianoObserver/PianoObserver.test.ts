import { PianoObserver } from './PianoObserver';
import type { tChord, tNoteWithOctave } from '../PianoBase/PianoBase.types';

describe('PianoObserver', () => {
  let pianoObserver: PianoObserver;
  let listener1: jest.Mock;
  let listener2: jest.Mock;

  beforeEach(() => {
    pianoObserver = new PianoObserver();
    listener1 = jest.fn();
    listener2 = jest.fn();
  });

  it('should subscribe a listener and notify it of a "notePlayed" event', () => {
    pianoObserver.subscribe(listener1);
    const event = { type: 'notePlayed' as const, note: 'C4' as tNoteWithOctave };
    pianoObserver.notify(event);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith(event);
  });

  it('should subscribe a listener and notify it of a "chordPlayed" event', () => {
    pianoObserver.subscribe(listener1);
    const event = { type: 'chordPlayed' as const, chord: ['C4', 'E4', 'G4'] as tChord };
    pianoObserver.notify(event);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith(event);
  });

  it('should subscribe a listener and notify it of a "sequenceEnded" event', () => {
    pianoObserver.subscribe(listener1);
    const event = { type: 'sequenceEnded' as const };
    pianoObserver.notify(event);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith(event);
  });

  it('should notify all subscribed listeners', () => {
    pianoObserver.subscribe(listener1);
    pianoObserver.subscribe(listener2);
    const event = { type: 'notePlayed' as const, note: 'A4' as tNoteWithOctave };
    pianoObserver.notify(event);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith(event);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith(event);
  });

  it('should allow a listener to unsubscribe', () => {
    const unsubscribe = pianoObserver.subscribe(listener1);
    pianoObserver.subscribe(listener2);

    unsubscribe(); // Unsubscribe listener1

    const event = { type: 'notePlayed' as const, note: 'B4' as tNoteWithOctave };
    pianoObserver.notify(event);

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith(event);
  });

  it('should not throw an error when notifying with no listeners', () => {
    const event = { type: 'notePlayed' as const, note: 'C4' as tNoteWithOctave };
    expect(() => pianoObserver.notify(event)).not.toThrow();
  });

  it('should handle multiple unsubscribes correctly', () => {
    const unsubscribe1 = pianoObserver.subscribe(listener1);
    const unsubscribe2 = pianoObserver.subscribe(listener2);

    const event1 = { type: 'notePlayed' as const, note: 'C4' as tNoteWithOctave };
    pianoObserver.notify(event1);
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    unsubscribe1();

    const event2 = { type: 'chordPlayed' as const, chord: ['D4', 'F#4', 'A4'] as tChord };
    pianoObserver.notify(event2);
    expect(listener1).toHaveBeenCalledTimes(1); // Not called again
    expect(listener2).toHaveBeenCalledTimes(2);
    expect(listener2).toHaveBeenCalledWith(event2);

    unsubscribe2();

    const event3 = { type: 'sequenceEnded' as const };
    pianoObserver.notify(event3);
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);
  });
});