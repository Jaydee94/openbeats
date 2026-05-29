// Package migrations embeds the golang-migrate SQL files so they can be
// applied automatically at server startup without shipping the .sql files
// separately.
package migrations

import "embed"

// FS contains all migration files in this directory.
//
//go:embed *.sql
var FS embed.FS
