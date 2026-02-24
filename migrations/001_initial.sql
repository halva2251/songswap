CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    context_crumb VARCHAR(100),
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE discoveries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    song_id INTEGER REFERENCES songs(id),
    liked BOOLEAN,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);