import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Track } from "../api/types";

export interface TrackFilters {
  q?: string;
  artist?: string;
  album?: string;
}

export function useTracks(filters: TrackFilters = {}) {
  return useQuery({
    queryKey: ["tracks", filters],
    queryFn: async () => {
      const { data } = await api.get<Track[]>("/api/tracks", { params: filters });
      return data;
    },
  });
}

export function useUploadTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { file: File; onProgress?: (pct: number) => void }) => {
      const form = new FormData();
      form.append("file", args.file);
      const { data } = await api.post<Track>("/api/tracks", form, {
        onUploadProgress: (e) => {
          if (args.onProgress && e.total) {
            args.onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}

export function useDeleteTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/tracks/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}
