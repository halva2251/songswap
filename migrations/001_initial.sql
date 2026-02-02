CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    context_crumb VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);