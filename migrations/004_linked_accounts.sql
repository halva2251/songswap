-- Allow OAuth-only users (no password)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- External account links (Last.fm, Discord, etc.)
CREATE TABLE linked_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_username VARCHAR(255) NOT NULL,
    session_key VARCHAR(255),
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_linked_accounts_user_id ON linked_accounts(user_id);