# songswap

**Give a song, get a song.** An anonymous music discovery app where you submit a song and receive a random one from a stranger — no algorithms, no recommendations, just human-curated serendipity.

Each song comes with an optional "context crumb" — a tiny hint from the person who shared it, like _"3am song"_ or _"play this loud"_.

## Why

Spotify's algorithm keeps recommending the same stuff. SongSwap breaks that loop by replacing algorithmic matching with randomness — you never know what you're going to get, and that's the point.

## Features

- **Anonymous song pool** — submit YouTube, Spotify, or SoundCloud links
- **Random discovery** — get a song you've never seen before, from a stranger
- **Context crumbs** — optional one-liners that give the song a vibe ("for the rain", "guilty pleasure")
- **Embedded players** — listen to YouTube and Spotify tracks without leaving the app
- **Like & history** — save the ones that hit, browse everything you've discovered
- **JWT authentication** — secure user accounts with token-based auth

## Tech Stack

| Layer    | Tech                                     |
| -------- | ---------------------------------------- |
| Frontend | React, TypeScript, Vite                  |
| Backend  | Go (standard library `net/http`)         |
| Database | PostgreSQL                               |
| Auth     | JWT (HS256) with bcrypt password hashing |

## Security

- **Rate limiting** — token bucket algorithm with per-IP tracking (`golang.org/x/time/rate`)
- **SSRF protection** — blocks requests to loopback and private IPs on song submission
- **URL validation** — verifies submitted URLs actually resolve before saving
- **Input validation** — enforces length limits on usernames, passwords, URLs, and context crumbs
- **Environment variables** — secrets loaded from `.env`, never hardcoded

## Project Structure

```
songswap/
├── cmd/api/
│   └── main.go              # Entry point, route registration, middleware chain
├── internal/
│   ├── database/
│   │   └── db.go            # PostgreSQL connection
│   ├── handlers/
│   │   ├── auth.go          # Register, login, JWT creation
│   │   └── handlers.go      # Song submission, discovery, likes, history
│   ├── middleware/
│   │   ├── auth.go          # JWT verification middleware
│   │   ├── cors.go          # CORS headers
│   │   └── ratelimit.go     # Per-IP rate limiting
│   └── models/
│       ├── song.go          # Song & submission types
│       └── user.go          # User & auth types
├── migrations/
│   └── 001_initial.sql      # Database schema
├── frontend/
│   └── src/
│       ├── App.tsx           # Layout, routing, auth state
│       ├── Discover.tsx      # Song discovery + submission
│       ├── History.tsx       # Discovery history
│       ├── EmbedPlayer.tsx   # YouTube/Spotify iframe embeds
│       ├── Auth.tsx          # Login/register
│       └── api.ts            # API client with auto-logout on 401
└── .env                      # JWT_SECRET (not committed)
```

## Getting Started

### Prerequisites

- Go 1.24+
- Node.js 18+
- PostgreSQL 14+

### Database Setup

```bash
sudo -u postgres createdb songswap
sudo -u postgres psql -d songswap -f migrations/001_initial.sql
```

You'll also need the users and discoveries tables:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE discoveries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    song_id INTEGER REFERENCES songs(id),
    liked BOOLEAN,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Environment

Create a `.env` file in the project root:

```
JWT_SECRET=your-secret-here
```

### Run

**Backend:**

```bash
go run cmd/api/main.go
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` with the API at `http://localhost:8080`.

## API Endpoints

| Method   | Route             | Auth | Description                |
| -------- | ----------------- | ---- | -------------------------- |
| `POST`   | `/register`       | No   | Create an account          |
| `POST`   | `/login`          | No   | Get a JWT token            |
| `POST`   | `/songs`          | No   | Submit a song to the pool  |
| `GET`    | `/discover`       | Yes  | Get a random unseen song   |
| `POST`   | `/songs/:id/like` | Yes  | Like a discovered song     |
| `DELETE` | `/songs/:id/like` | Yes  | Unlike a song              |
| `GET`    | `/history`        | Yes  | Get your discovery history |
| `GET`    | `/health`         | No   | Health check               |

## Roadmap

- [ ] Deploy (Fly.io / Railway)
- [ ] Themed chains (curated collections)
- [ ] Reactions (let the sender know their song landed)
- [ ] Mobile-responsive design
- [ ] Tailwind CSS migration

## License

MIT
