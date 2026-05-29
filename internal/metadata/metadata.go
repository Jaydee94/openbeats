// Package metadata extracts ID3 / tag information and embedded cover art from
// uploaded audio files using github.com/dhowden/tag.
package metadata

import (
	"io"

	"github.com/dhowden/tag"
)

// Cover holds an embedded cover image extracted from a tag.
type Cover struct {
	Data     []byte
	MIMEType string
	Ext      string // file extension without dot, e.g. "jpg"
}

// Info is the subset of tag metadata OpenBeats stores.
type Info struct {
	Title  string
	Artist string
	Album  string
	Genre  string
	// DurationSeconds is best-effort; the tag library does not reliably expose
	// stream duration, so this is 0 unless a caller fills it in.
	DurationSeconds int
	Cover           *Cover
}

// Extract reads tag metadata and any embedded cover from r. r must support
// seeking (the tag library reads from multiple offsets). On parse failure it
// returns a zero Info and the underlying error so the caller can fall back to
// the original filename.
func Extract(r io.ReadSeeker) (Info, error) {
	m, err := tag.ReadFrom(r)
	if err != nil {
		return Info{}, err
	}

	info := Info{
		Title:  m.Title(),
		Artist: m.Artist(),
		Album:  m.Album(),
		Genre:  m.Genre(),
	}

	if pic := m.Picture(); pic != nil && len(pic.Data) > 0 {
		ext := pic.Ext
		if ext == "" {
			ext = "jpg"
		}
		info.Cover = &Cover{
			Data:     pic.Data,
			MIMEType: pic.MIMEType,
			Ext:      ext,
		}
	}

	return info, nil
}
