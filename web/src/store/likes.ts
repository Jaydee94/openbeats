import { create } from "zustand";

// Likes are client-only/session state: the backend currently exposes no
// favourites endpoint, so this purely drives the heart toggles in the UI.
interface LikesState {
  liked: Set<string>;
  isLiked: (id: string) => boolean;
  toggle: (id: string) => void;
}

export const useLikesStore = create<LikesState>((set, get) => ({
  liked: new Set<string>(),
  isLiked: (id) => get().liked.has(id),
  toggle: (id) =>
    set((s) => {
      const next = new Set(s.liked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { liked: next };
    }),
}));
