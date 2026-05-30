import { useRef, useState } from "react";
import { useUploadTrack } from "../hooks/useTracks";
import { Icon } from "../design/Icon";

export function UploadDialog({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadTrack();

  const submit = async () => {
    if (!file) return;
    await upload.mutateAsync({ file, onProgress: setProgress });
    onClose();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__title">Upload music</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        <div className="dropzone" onClick={() => inputRef.current?.click()}>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,video/mp4,.mp3,.flac,.m4a,.ogg,.mp4"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Icon name="upload" />
          {file ? (
            <div className="dropzone__file">{file.name}</div>
          ) : (
            <div>
              <b>Click to browse audio files</b>
            </div>
          )}
          <small>MP3, FLAC, WAV, M4A, OGG, MP4 · up to 200 MB each</small>
        </div>

        {upload.isPending && (
          <div className="upload-progress">
            <div className="upload-progress__fill" style={{ width: `${progress}%` }} />
          </div>
        )}
        {upload.isError && <p className="login__error">Upload failed.</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="ghost-btn" style={{ height: 42 }} onClick={onClose} disabled={upload.isPending}>
            Cancel
          </button>
          <button className="upload-btn" onClick={submit} disabled={!file || upload.isPending}>
            <Icon name="check" /> {upload.isPending ? "Uploading…" : "Add to library"}
          </button>
        </div>
      </div>
    </div>
  );
}
