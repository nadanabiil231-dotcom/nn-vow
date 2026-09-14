CREATE TABLE IF NOT EXISTS invitations (slug TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_invitations_created_at ON invitations(created_at);
