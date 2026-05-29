// Package storage manages audio files and cover images on the persistent
// volume mounted at the configured STORAGE_PATH. Binary data never goes into
// Postgres — only the relative file paths are persisted in the database.
package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// Storage provides filesystem access rooted at a base directory.
type Storage struct {
	base string
}

// Subdirectories used for the different asset types.
const (
	TracksDir = "tracks"
	CoversDir = "covers"
)

// New creates the storage root and its subdirectories if they do not exist.
func New(base string) (*Storage, error) {
	for _, d := range []string{TracksDir, CoversDir} {
		if err := os.MkdirAll(filepath.Join(base, d), 0o755); err != nil {
			return nil, fmt.Errorf("create storage dir %s: %w", d, err)
		}
	}
	return &Storage{base: base}, nil
}

// abs resolves a relative path against the base and guards against traversal.
func (s *Storage) abs(rel string) (string, error) {
	clean := filepath.Clean("/" + rel) // ensure it cannot escape with ".."
	full := filepath.Join(s.base, clean)
	if !filepathWithin(s.base, full) {
		return "", fmt.Errorf("invalid path %q", rel)
	}
	return full, nil
}

func filepathWithin(base, target string) bool {
	rel, err := filepath.Rel(base, target)
	if err != nil {
		return false
	}
	return rel != ".." && !hasDotDotPrefix(rel)
}

func hasDotDotPrefix(p string) bool {
	return len(p) >= 2 && p[0] == '.' && p[1] == '.'
}

// SaveReader streams r into <subdir>/<name> and returns the relative path.
func (s *Storage) SaveReader(subdir, name string, r io.Reader) (string, error) {
	rel := filepath.Join(subdir, name)
	full, err := s.abs(rel)
	if err != nil {
		return "", err
	}
	f, err := os.Create(full)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer f.Close()
	if _, err := io.Copy(f, r); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}
	return rel, nil
}

// SaveBytes writes b into <subdir>/<name> and returns the relative path.
func (s *Storage) SaveBytes(subdir, name string, b []byte) (string, error) {
	rel := filepath.Join(subdir, name)
	full, err := s.abs(rel)
	if err != nil {
		return "", err
	}
	if err := os.WriteFile(full, b, 0o644); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}
	return rel, nil
}

// Open opens the file at the given relative path for reading. The returned
// *os.File is an io.ReadSeeker suitable for http.ServeContent.
func (s *Storage) Open(rel string) (*os.File, error) {
	full, err := s.abs(rel)
	if err != nil {
		return nil, err
	}
	return os.Open(full)
}

// Delete removes the file at the given relative path. Missing files are ignored.
func (s *Storage) Delete(rel string) error {
	if rel == "" {
		return nil
	}
	full, err := s.abs(rel)
	if err != nil {
		return err
	}
	if err := os.Remove(full); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
