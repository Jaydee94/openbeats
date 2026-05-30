# MP4 Upload & Playback Support

**Date:** 2026-05-30  
**Status:** Approved

## Summary

Allow users to upload MP4 files (video/mp4 — music videos or audio-only M4A containers) and play them back in the browser. Minimal changes: two frontend files, no backend changes.

## Scope

- **In scope:** upload MP4, stream MP4, render `<video>` in the player when MIME type is `video/*`
- **Out of scope:** video thumbnails in track list, fullscreen UI, video-specific metadata, duration extraction, separate Videos section

## Why no backend changes?

The upload handler already:
- Accepts any file type (no MIME allowlist)
- Stores files with the original extension (`.mp4`)
- Derives MIME type from the `Content-Type` header sent by the browser (`video/mp4`), or falls back to `mime.TypeByExtension(".mp4")` → `video/mp4`
- Persists `mime_type` in the DB and returns it via the API

`dhowden/tag` handles MP4 atoms (title/artist/album/cover for M4A/AAC). For pure video MP4, tag extraction fails and is logged as a warning — the filename is used as fallback title. This is already the existing behaviour.

## Frontend changes

### 1. `web/src/components/UploadDialog.tsx`

Add `video/mp4` and `.mp4` to the file input's `accept` attribute:

```
accept="audio/*,video/mp4,.mp3,.flac,.m4a,.ogg,.mp4"
```

### 2. `web/src/components/Player.tsx`

The player stores the current track, which includes `mimeType` from the API. Render `<video>` instead of `<audio>` when `mimeType` starts with `video/`:

- Extract a helper `isVideo(mimeType: string) = mimeType.startsWith('video/')`
- Conditionally render `<video controls>` vs `<audio>` using the same `ref` pattern
- All existing playback logic (play/pause, volume, seek, `src`) remains unchanged
- `<video>` uses the same stream URL with `?token=` parameter

## Data flow

```
User selects .mp4 → UploadDialog sends multipart POST /api/tracks
  → Backend stores file, sets mime_type = "video/mp4"
  → GET /api/tracks returns track with mimeType: "video/mp4"
  → Player renders <video> element
  → GET /api/tracks/{id}/stream served with Content-Type: video/mp4
  → Browser plays video inline
```

## Error handling

No new error cases. The existing fallbacks cover:
- Tag extraction failure → filename used as title (already implemented)
- Stream not found → 404 (already implemented)

## Testing

- Upload a `.mp4` file via the UI → verify it appears in the library
- Click play → verify `<video>` element renders and plays
- Upload a `.mp3` → verify `<audio>` element still renders (no regression)
