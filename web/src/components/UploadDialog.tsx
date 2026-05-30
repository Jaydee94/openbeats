import { useState } from "react";
import { useUploadTrack } from "../hooks/useTracks";

export function UploadDialog({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const upload = useUploadTrack();

  const submit = async () => {
    if (!file) return;
    await upload.mutateAsync({ file, onProgress: setProgress });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Upload track</h3>
        <input
          type="file"
          accept="audio/*,video/mp4,.mp3,.flac,.m4a,.ogg,.mp4"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {upload.isPending && (
          <progress value={progress} max={100}>
            {progress}%
          </progress>
        )}
        {upload.isError && <p className="error">Upload failed.</p>}
        <div className="modal__actions">
          <button onClick={onClose} disabled={upload.isPending}>
            Cancel
          </button>
          <button onClick={submit} disabled={!file || upload.isPending}>
            {upload.isPending ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
