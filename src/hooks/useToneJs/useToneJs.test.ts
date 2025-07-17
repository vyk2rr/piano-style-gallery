import { renderHook, act } from '@testing-library/react';
import useToneJs from './useToneJs';
import type { tChord, tMelodySequence } from '../../PianoBase/PianoBase.types';

jest.mock('tone');
const { triggerAttackReleaseMock, getTransport, getDestination } = require('tone');

describe('useToneJs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTransport().bpm.value = 120;
    getDestination().volume.value = 0;
  });

  it('sets initial bpm and volume', () => {
    renderHook(() => useToneJs({ bpm: 140 }));
    expect(getTransport().bpm.value).toBe(140);
    expect(getDestination().volume.value).toBe(0);
  });

  it('start() calls Tone.start and transport.start and sets isReady', async () => {
    const { result } = renderHook(() => useToneJs());
    await act(async () => {
      await result.current.start();
    });
    const ToneMock = require('tone');
    expect(ToneMock.start).toHaveBeenCalled();
    expect(getTransport().start).toHaveBeenCalled();
    expect(result.current.isReady).toBe(true);
  });

  it('play(), pause(), stop() control the transport', () => {
    const { result } = renderHook(() => useToneJs());
    act(() => result.current.play());
    act(() => result.current.pause());
    act(() => result.current.stop());
    const transport = getTransport();
    expect(transport.start).toHaveBeenCalled();
    expect(transport.pause).toHaveBeenCalled();
    expect(transport.stop).toHaveBeenCalled();
    expect(transport.cancel).toHaveBeenCalled();
  });

  it('setMasterVolume() changes the volume', () => {
    const { result } = renderHook(() => useToneJs());
    act(() => {
      result.current.setMasterVolume(-12);
    });
    expect(getDestination().volume.value).toBe(-12);
  });

  it('setBpm() changes the bpm', () => {
    const { result } = renderHook(() => useToneJs());
    act(() => {
      result.current.setBpm(180);
    });
    expect(getTransport().bpm.value).toBe(180);
  });

  it('cancelScheduledEvents() calls transport.cancel()', () => {
    const { result } = renderHook(() => useToneJs());
    act(() => {
      result.current.cancelScheduledEvents();
    });
    expect(getTransport().cancel).toHaveBeenCalled();
  });

  it('initializes synthRef correctly', () => {
    const { result } = renderHook(() => useToneJs());
    expect(result.current.synthRef.current).toBeDefined();
    expect(typeof result.current.synthRef.current?.triggerAttackRelease).toBe('function');
  });

  it('playNote() calls triggerAttackRelease', async () => {
    const { result } = renderHook(() => useToneJs());
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.playNote('C4', '8n');
    });
    expect(triggerAttackReleaseMock).toHaveBeenCalledWith('C4', '8n', undefined, 0.7);
  });

  it('playChord() calls triggerAttackRelease with array', async () => {
    const { result } = renderHook(() => useToneJs());
    await act(async () => {
      await result.current.start();
    });
    const chord: tChord = ['C4', 'E4', 'G4'];
    await act(async () => {
      await result.current.playChord(chord, '4n');
    });
    expect(triggerAttackReleaseMock).toHaveBeenCalledWith(chord, '4n', undefined, 0.7);
  });

  it('playArpeggio() calls triggerAttackRelease for each note', async () => {
    const { result } = renderHook(() => useToneJs());
    await act(async () => {
      await result.current.start();
    });
    const chord: tChord = ['C4', 'E4', 'G4'];
    await act(async () => {
      await result.current.playArpeggio(chord, '8n', '16n');
    });
    expect(triggerAttackReleaseMock).toHaveBeenCalledWith('C4', '8n', undefined, 0.7);
    expect(triggerAttackReleaseMock).toHaveBeenCalledWith('E4', '8n', undefined, 0.7);
    expect(triggerAttackReleaseMock).toHaveBeenCalledWith('G4', '8n', undefined, 0.7);
    expect(triggerAttackReleaseMock).toHaveBeenCalledTimes(3);
  });

  it('durationToMs converts duration to milliseconds', () => {
    const { result } = renderHook(() => useToneJs());
    expect(result.current.durationToMs('4n')).toBe(500); // The mock returns 500
  });

  it('scheduleMelody creates a Tone.Part and starts it', () => {
    const { result } = renderHook(() => useToneJs());
    const onEventCallback = jest.fn();
    const onComplete = jest.fn();
    const sequence: tMelodySequence = [{ time: '0:0:0', pitches: ['C4'], duration: '4n', velocity: 0.7 }];

    act(() => {
      result.current.scheduleMelody(sequence, onEventCallback, onComplete);
    });

    const PartMock = require('tone').Part;
    expect(PartMock).toHaveBeenCalled();
  });
});