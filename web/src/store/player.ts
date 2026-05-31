import { create } from "zustand";
import type { Track } from "../api/types";

interface PlayerState {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  prevVolume: number;
  shuffle: boolean;
  repeat: boolean;
  npOpen: boolean;
  /** A pending seek target (seconds) the media element should apply, or null. */
  seekTo: number | null;

  playQueue: (tracks: Track[], startIndex: number) => void;
  playTrack: (track: Track) => void;
  jumpTo: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  /** Called when a track ends naturally — honours repeat/shuffle. */
  handleEnded: () => void;
  current: () => Track | null;

  setProgress: (s: number) => void;
  setDuration: (s: number) => void;
  seek: (s: number) => void;
  clearSeek: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  setShuffle: (v: boolean) => void;
  toggleRepeat: () => void;

  openNowPlaying: () => void;
  closeNowPlaying: () => void;
}

function pickNext(index: number, len: number, shuffle: boolean): number {
  if (len <= 1) return index;
  if (shuffle) {
    let n = index;
    while (n === index) n = Math.floor(Math.random() * len);
    return n;
  }
  return index + 1;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  prevVolume: 0.8,
  shuffle: false,
  repeat: false,
  npOpen: false,
  seekTo: null,

  playQueue: (tracks, startIndex) =>
    set({ queue: tracks, index: startIndex, isPlaying: true, progress: 0 }),
  playTrack: (track) => set({ queue: [track], index: 0, isPlaying: true, progress: 0 }),
  jumpTo: (index) => {
    const { queue } = get();
    if (index >= 0 && index < queue.length) set({ index, isPlaying: true, progress: 0 });
  },
  setPlaying: (playing) => set({ isPlaying: playing }),
  toggle: () => {
    if (get().current()) set((s) => ({ isPlaying: !s.isPlaying }));
  },
  next: () => {
    const { index, queue, shuffle } = get();
    const ni = pickNext(index, queue.length, shuffle);
    if (ni < queue.length) set({ index: ni, isPlaying: true, progress: 0 });
  },
  prev: () => {
    const { index, progress } = get();
    if (progress > 3) set({ seekTo: 0, progress: 0 });
    else if (index > 0) set({ index: index - 1, isPlaying: true, progress: 0 });
    else set({ seekTo: 0, progress: 0 });
  },
  handleEnded: () => {
    const { index, queue, shuffle, repeat } = get();
    if (repeat) {
      set({ seekTo: 0, progress: 0, isPlaying: true });
      return;
    }
    const ni = pickNext(index, queue.length, shuffle);
    if (ni < queue.length && ni !== index) set({ index: ni, isPlaying: true, progress: 0 });
    else set({ isPlaying: false, progress: 0 });
  },
  current: () => {
    const { queue, index } = get();
    return queue[index] ?? null;
  },

  setProgress: (s) => set({ progress: s }),
  setDuration: (s) => set({ duration: s }),
  seek: (s) => set({ seekTo: s, progress: s }),
  clearSeek: () => set({ seekTo: null }),
  setVolume: (v) => set((s) => ({ volume: v, prevVolume: v > 0 ? v : s.prevVolume })),
  toggleMute: () =>
    set((s) => (s.volume > 0 ? { volume: 0 } : { volume: s.prevVolume || 0.8 })),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  setShuffle: (v) => set({ shuffle: v }),
  toggleRepeat: () => set((s) => ({ repeat: !s.repeat })),

  openNowPlaying: () => set({ npOpen: true }),
  closeNowPlaying: () => set({ npOpen: false }),
}));
