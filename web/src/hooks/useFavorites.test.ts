import { describe, it, expect } from "vitest";
import { applyFavoriteToggle } from "./useFavorites";
import type { Track } from "../api/types";

function track(id: string): Track {
  return {
    id,
    title: `Track ${id}`,
    artist: "Artist",
    album: "Album",
    duration_seconds: 100,
    mime_type: "audio/mpeg",
    has_cover: false,
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("applyFavoriteToggle", () => {
  it("prepends a newly liked track (newest first)", () => {
    const prev = [track("a")];
    const next = applyFavoriteToggle(prev, track("b"), false);
    expect(next.map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("removes a track that is being un-liked", () => {
    const prev = [track("a"), track("b")];
    const next = applyFavoriteToggle(prev, track("a"), true);
    expect(next.map((t) => t.id)).toEqual(["b"]);
  });

  it("does not mutate the input array", () => {
    const prev = [track("a")];
    applyFavoriteToggle(prev, track("b"), false);
    expect(prev.map((t) => t.id)).toEqual(["a"]);
  });

  it("is a no-op-ish add when the track is already present and isFavorite=false would duplicate — guarded by ids in the controller", () => {
    // The controller passes isFavorite based on the current id set, so a true
    // toggle alternates cleanly: add then remove returns to the original.
    const start: Track[] = [];
    const added = applyFavoriteToggle(start, track("x"), false);
    const removed = applyFavoriteToggle(added, track("x"), true);
    expect(removed).toEqual([]);
  });
});
