package auth

import (
	"testing"
	"time"
)

func TestHashAndCheckPassword(t *testing.T) {
	hash, err := HashPassword("s3cret")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if !CheckPassword(hash, "s3cret") {
		t.Fatal("expected password to match")
	}
	if CheckPassword(hash, "wrong") {
		t.Fatal("expected password mismatch")
	}
}

func TestJWTRoundTrip(t *testing.T) {
	m := NewManager("test-secret", time.Hour)
	token, err := m.Generate("user-123", "alice", "admin")
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	claims, err := m.Parse(token)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if claims.UserID != "user-123" || claims.Username != "alice" || claims.Role != "admin" {
		t.Fatalf("unexpected claims: %+v", claims)
	}
}

func TestJWTRejectsWrongSecret(t *testing.T) {
	m1 := NewManager("secret-one", time.Hour)
	m2 := NewManager("secret-two", time.Hour)
	token, _ := m1.Generate("u", "u", "user")
	if _, err := m2.Parse(token); err == nil {
		t.Fatal("expected validation failure for token signed with a different secret")
	}
}

func TestJWTRejectsExpired(t *testing.T) {
	m := NewManager("secret", -time.Minute)
	token, _ := m.Generate("u", "u", "user")
	if _, err := m.Parse(token); err == nil {
		t.Fatal("expected expired token to be rejected")
	}
}
