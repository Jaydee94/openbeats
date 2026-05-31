import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Track } from "../api/types";

const FAVORITES_KEY = ["favorites"] as const;

/** All favourited tracks for the current user, newest first. */
export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: async () => {
      const { data } = await api.get<Track[]>("/api/favorites");
      return data;
    },
  });
}

/**
 * Pure reducer for the optimistic cache update: removes the track when it is
 * already favourited, otherwise prepends it (newest first). Exported so the
 * toggle behaviour can be unit-tested without React.
 */
export function applyFavoriteToggle(prev: Track[], track: Track, isFavorite: boolean): Track[] {
  return isFavorite ? prev.filter((t) => t.id !== track.id) : [track, ...prev];
}

interface ToggleVars {
  track: Track;
  isFavorite: boolean;
}

/**
 * Adds/removes a favourite with an optimistic cache update and rollback on
 * error (TanStack Query v5 pattern: cancel → snapshot → setQueryData → rollback
 * onError → invalidate onSettled).
 */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ track, isFavorite }: ToggleVars) => {
      if (isFavorite) await api.delete(`/api/favorites/${track.id}`);
      else await api.post("/api/favorites", { track_id: track.id });
    },
    onMutate: async ({ track, isFavorite }: ToggleVars) => {
      await qc.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = qc.getQueryData<Track[]>(FAVORITES_KEY) ?? [];
      qc.setQueryData<Track[]>(FAVORITES_KEY, applyFavoriteToggle(previous, track, isFavorite));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(FAVORITES_KEY, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}

/**
 * Convenience controller used across the UI: exposes the set of favourited
 * track ids and a `toggle(track)` that derives the current state itself.
 */
export function useFavoritesController() {
  const { data } = useFavorites();
  const ids = useMemo(() => new Set((data ?? []).map((t) => t.id)), [data]);
  const mutation = useToggleFavorite();
  const toggle = (track: Track) => mutation.mutate({ track, isFavorite: ids.has(track.id) });
  return { ids, toggle };
}
