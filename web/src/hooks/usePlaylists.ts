import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Playlist, PlaylistDetail } from "../api/types";

export function usePlaylists() {
  return useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const { data } = await api.get<Playlist[]>("/api/playlists");
      return data;
    },
  });
}

export function usePlaylist(id: string | null) {
  return useQuery({
    queryKey: ["playlist", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<PlaylistDetail>(`/api/playlists/${id}`);
      return data;
    },
  });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<Playlist>("/api/playlists", { name });
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}

export function useAddTrackToPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { playlistId: string; trackId: string }) => {
      await api.post(`/api/playlists/${args.playlistId}/tracks`, {
        track_id: args.trackId,
      });
    },
    onSuccess: (_data, args) => {
      void qc.invalidateQueries({ queryKey: ["playlist", args.playlistId] });
    },
  });
}
