-- Wins (hackathon victories)
CREATE TABLE wins (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    hackathon_name VARCHAR(255) NOT NULL,
    result VARCHAR(100) NOT NULL,
    prize INTEGER DEFAULT 0,
    award_date DATE,
    year INTEGER NOT NULL,
    link VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for filtering and sorting
CREATE INDEX idx_wins_year ON wins(year);
CREATE INDEX idx_wins_sort ON wins(sort_order DESC, award_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_wins_updated_at 
    BEFORE UPDATE ON wins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,           -- CREATE, UPDATE, DELETE
    entity_type VARCHAR(50) NOT NULL,      -- win, project, etc.
    entity_id INTEGER,
    changes JSONB,                         -- What changed
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
