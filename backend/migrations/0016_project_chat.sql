-- Migration: 0016_project_chat.sql
-- Add project chat tables: chat_messages, chat_pins, chat_reads

CREATE TABLE IF NOT EXISTS chat_messages (
    id serial PRIMARY KEY,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sender_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages (project_id, id);

CREATE TABLE IF NOT EXISTS chat_pins (
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    pinned_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS chat_reads (
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    last_read_message_id integer NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, project_id)
);

-- REVERSE SQL:
-- DROP TABLE IF EXISTS chat_reads;
-- DROP TABLE IF EXISTS chat_pins;
-- DROP TABLE IF EXISTS chat_messages;
