package db

import (
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ParseUUID converts a UUID string into a pgtype.UUID.
func ParseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}

// UUIDString renders a pgtype.UUID as its canonical string form, or "" if null.
func UUIDString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return uuid.UUID(u.Bytes).String()
}

// PgText wraps a string in a pgtype.Text, treating "" as a non-null empty value.
func PgText(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: true}
}

// PgTextPtr wraps an optional string in a pgtype.Text; nil yields NULL.
func PgTextPtr(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// TextValue returns the string value of a pgtype.Text, or "" when null.
func TextValue(t pgtype.Text) string {
	if !t.Valid {
		return ""
	}
	return t.String
}
