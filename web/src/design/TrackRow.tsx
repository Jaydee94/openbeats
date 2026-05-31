/* OpenBeats — track row for tracklists */
import type { Track } from "../api/types";
import { fmt } from "./format";
import { coverFor } from "./palette";
import { trackCoverSrc, trackSeed } from "../hooks/useLibrary";
import { Cover } from "./Cover";
import { Icon } from "./Icon";
import { TrackMenu } from "../components/TrackMenu";

export function TrackRow({
  track,
  index,
  isCurrent,
  isPlaying,
  liked,
  middleText,
  onPlay,
  onLike,
}: {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  liked: boolean;
  middleText: string;
  onPlay: () => void;
  onLike: () => void;
}) {
  const { pal, motif } = coverFor(trackSeed(track));
  return (
    <div className={"trow" + (isCurrent ? " playing" : "")} onClick={onPlay}>
      <div className="trow__idx">
        {isCurrent && isPlaying ? (
          <span className="eqbars">
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : (
          <>
            <span className="idx-num">{index + 1}</span>
            <span className="idx-play">
              <Icon name="play" />
            </span>
          </>
        )}
      </div>
      <div className="trow__main">
        <Cover className="trow__cover" pal={pal} motif={motif} src={trackCoverSrc(track)} radius={6} />
        <div className="trow__t">
          <div className="trow__title">{track.title}</div>
          <div className="trow__artist">{track.artist || "Unknown artist"}</div>
        </div>
      </div>
      <div className="trow__album">{middleText}</div>
      <div
        className="trow__dur"
        style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}
      >
        <button
          className={"row-like" + (liked ? " on" : "")}
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          aria-label="Like"
        >
          <Icon name={liked ? "heartFill" : "heart"} style={{ width: 15, height: 15 }} />
        </button>
        <span style={{ width: 34, textAlign: "right" }}>{fmt(track.duration_seconds)}</span>
        <TrackMenu track={track} />
      </div>
    </div>
  );
}
