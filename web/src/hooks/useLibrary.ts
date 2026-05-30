import { useMemo } from "react";
import { mediaUrl } from "../api/client";
import type { Track } from "../api/types";
import { coverFor, type Motif } from "../design/palette";
import { useTracks } from "./useTracks";

export interface Album {
  id: string;
  title: string;
  artist: string;
  tracks: Track[];
  pal: string;
  motif: Motif;
  /** Real cover image URL, if any track in the album carries cover art. */
  coverSrc?: string;
}

export interface Artist {
  id: string;
  name: string;
  albums: Album[];
  trackCount: number;
  pal: string;
  motif: Motif;
}

/** URL-safe slug used as a route id for derived albums/artists. */
export function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

export function albumId(artist: string, title: string): string {
  return `${slug(artist || "unknown")}--${slug(title || "untitled")}`;
}

/** Cover URL for a single track, or undefined when it has no embedded art. */
export function trackCoverSrc(track: Track): string | undefined {
  return track.has_cover ? mediaUrl(`/api/tracks/${track.id}/cover`) : undefined;
}

/** Stable cover seed so every track of an album shares the same generative art. */
export function trackSeed(track: Track): string {
  return `${track.artist || "unknown"}::${track.album || track.title}`;
}

function buildAlbums(tracks: Track[]): Album[] {
  const byKey = new Map<string, Album>();
  for (const t of tracks) {
    const artist = t.artist || "Unknown Artist";
    const title = t.album || "Singles";
    const id = albumId(artist, title);
    let album = byKey.get(id);
    if (!album) {
      const { pal, motif } = coverFor(`${artist}::${title}`);
      album = { id, title, artist, tracks: [], pal, motif };
      byKey.set(id, album);
    }
    album.tracks.push(t);
    if (!album.coverSrc && t.has_cover) album.coverSrc = mediaUrl(`/api/tracks/${t.id}/cover`);
  }
  return [...byKey.values()].sort((a, b) => a.title.localeCompare(b.title));
}

function buildArtists(albums: Album[]): Artist[] {
  const byName = new Map<string, Artist>();
  for (const al of albums) {
    let artist = byName.get(al.artist);
    if (!artist) {
      const { pal, motif } = coverFor(`artist::${al.artist}`);
      artist = { id: slug(al.artist), name: al.artist, albums: [], trackCount: 0, pal, motif };
      byName.set(al.artist, artist);
    }
    artist.albums.push(al);
    artist.trackCount += al.tracks.length;
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function useLibrary(q?: string) {
  const { data: tracks, isLoading } = useTracks({ q: q || undefined });
  const all = useMemo(() => tracks ?? [], [tracks]);
  const albums = useMemo(() => buildAlbums(all), [all]);
  const artists = useMemo(() => buildArtists(albums), [albums]);
  return { tracks: all, albums, artists, isLoading };
}
