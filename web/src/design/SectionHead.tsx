/* OpenBeats — section heading with optional "show all" link */
export function SectionHead({
  title,
  more,
  onMore,
}: {
  title: string;
  more?: string;
  onMore?: () => void;
}) {
  return (
    <div className="section__head">
      <h2 className="section__title">{title}</h2>
      {more && (
        <a className="section__more" onClick={onMore}>
          {more}
        </a>
      )}
    </div>
  );
}
