/* OpenBeats — album / playlist card */
import { Cover } from "./Cover";
import { Icon } from "./Icon";

export function AlbumCard({
  title,
  sub,
  pal,
  motif,
  coverSrc,
  onOpen,
  onPlay,
}: {
  title: string;
  sub: string;
  pal: string;
  motif: string;
  coverSrc?: string;
  onOpen: () => void;
  onPlay: () => void;
}) {
  return (
    <div className="card" onClick={onOpen}>
      <div className="card__art">
        <Cover pal={pal} motif={motif} src={coverSrc} alt={title} style={{ width: "100%", height: "100%" }} />
        <button
          className="card__play"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          aria-label="Play"
        >
          <Icon name="play" />
        </button>
      </div>
      <div className="card__title">{title}</div>
      <div className="card__sub">{sub}</div>
    </div>
  );
}
