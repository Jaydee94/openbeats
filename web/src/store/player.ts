import { create } from "zustand";
import type { Track } from "../api/types";

interface PlayerState {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  playQueue: (tracks: Track[], startIndex: number) => void;
  playTrack: (track: Track) => void;
  setPlaying: (playing: boolean) => void;
  next: () => void;
  prev: () => void;
  current: () => Track | null;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  isPlaying: false,
  playQueue: (tracks, startIndex) =>
    set({ queue: tracks, index: startIndex, isPlaying: true }),
  playTrack: (track) => set({ queue: [track], index: 0, isPlaying: true }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  next: () => {
    const { index, queue } = get();
    if (index < queue.length - 1) set({ index: index + 1, isPlaying: true });
  },
  prev: () => {
    const { index } = get();
    if (index > 0) set({ index: index - 1, isPlaying: true });
  },
  current: () => {
    const { queue, index } = get();
    return queue[index] ?? null;
  },
}));
