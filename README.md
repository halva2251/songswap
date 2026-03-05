# songswap

**Give a song, get a song.** An anonymous music discovery app where you submit a song and receive a random one from a stranger. No algorithms, no recommendations, just human-curated serendipity.

Each song comes with an optional "context crumb". A tiny hint from the person who shared it, like _"3am song"_ or _"play this loud"_.

## Why

Spotify's algorithm keeps recommending the same stuff. SongSwap breaks that loop by replacing algorithmic matching with randomness. You never know what you're going to get, and that's the point.

## Features

- **Anonymous song pool** — submit YouTube, Spotify, or SoundCloud links
- **Random discovery** — get a song you've never seen before, from a stranger
- **Context crumbs** — optional one-liners that give the song a vibe ("for the rain", "guilty pleasure")
- **Themed chains** — community-created collections (e.g. "3am vibes", "guilty pleasures") where anyone can contribute; songs can exist in both the main pool and chains simultaneously
- **Shuffle within chains** — jump to a random song in a chain with smooth scroll and highlight
- **Embedded players** — listen to YouTube and Spotify tracks inline without leaving the app
- **Like & history** — save the ones that hit, browse everything you've discovered
- **JWT authentication** — secure user accounts with token-based auth

## Tech Stack

| Layer    | Tech                                       |
| -------- | ------------------------------------------ |
| Frontend | React, TypeScript, Vite                    |
| Backend  | Go (standard library `net/http`)           |
| Database | PostgreSQL                                 |
| Auth     | JWT (HS256) with bcrypt password hashing   |
| Deploy   | Fly.io (backend), Vercel (frontend)        |
| CI/CD    | GitHub Actions → Fly.io auto-deploy        |
| DevOps   | Docker, Docker Compose, multi-stage builds |

## Security & Backend Design

**Rate limiting** — Token bucket algorithm with per-IP tracking using `golang.org/x/time/rate`. Each IP gets its own bucket with configurable rate and burst limits. A background goroutine cleans up stale clients every minute to prevent memory leaks.

**SSRF protection** — Song URL submissions are validated against loopback, private, and link-local IP ranges before any outbound request is made. Domain names are resolved and checked, not just the raw URL string.

**URL validation** — Submitted URLs are verified with an HTTP HEAD request (5s timeout) to confirm they actually resolve before being saved to the database. This prevents dead links from polluting the song pool.

**Input validation** — Enforced length limits across all user inputs: usernames (3–30 chars), passwords (8-72 chars, respecting bcrypt's limit), URLs (max 2000 chars), context crumbs (max 100 chars), chain names (max 50 chars), chain descriptions (max 200 chars).

**CORS** — Configurable allowed origins via environment variable, with per-request origin checking rather than a blanket wildcard.

**Auth middleware** — JWT tokens are verified on protected routes using a reusable middleware function that extracts the user ID into request context, keeping handler logic clean.

## Testing

Unit tests cover input validation and middleware without requiring a database connection:

- **Handler tests** (`handlers_test.go`) — Validates all input edge cases: empty fields, invalid JSON, URL format enforcement, field length limits, and unauthorized access. Uses `httptest.NewRequest` and `httptest.NewRecorder` to test handlers in isolation.
- **Auth middleware tests** (`auth_test.go`) — Tests missing headers, invalid formats, expired tokens, wrong signing secrets, and valid token extraction with correct user ID propagation through context.
- **Rate limiter tests** (`ratelimit_test.go`) — Verifies normal traffic passes, excess traffic gets blocked with 429 status, and that different IPs are tracked independently with separate token buckets.
- **Platform detection tests** — Table-driven tests covering YouTube (full + short URLs), Spotify, SoundCloud, unknown domains, and case-insensitive matching.

Run tests with:

```bash
go test ./internal/...
```

## Project Structure

```
songswap/
├── cmd/api/
│   └── main.go                # Entry point, route registration, middleware chain
├── internal/
│   ├── database/
│   │   └── db.go              # PostgreSQL connection
│   ├── handlers/
│   │   ├── auth.go            # Register, login, JWT creation
│   │   ├── handlers.go        # Song submission, discovery, likes, history
│   │   ├── handlers_test.go   # Input validation + handler unit tests
│   │   └── chains.go          # Chain CRUD, add/remove songs
│   ├── middleware/
│   │   ├── auth.go            # JWT verification middleware
│   │   ├── auth_test.go       # Auth middleware tests
│   │   ├── cors.go            # CORS headers
│   │   ├── ratelimit.go       # Per-IP rate limiting
│   │   └── ratelimit_test.go  # Rate limiter tests
│   └── models/
│       ├── song.go            # Song & submission types
│       ├── user.go            # User & auth types
│       └── chain.go           # Chain & chain song types
├── migrations/
│   ├── 001_initial.sql        # Users, songs, discoveries tables
│   ├── 002_chains.sql         # Chains and chain_songs tables
│   └── 003_discoveries_unique.sql  # Unique constraint fix
├── frontend/
│   └── src/
│       ├── App.tsx            # Layout, routing, auth state
│       ├── Discover.tsx       # Song discovery + submission + chain view
│       ├── Chains.tsx         # Chain listing + creation
│       ├── History.tsx        # Discovery history
│       ├── EmbedPlayer.tsx    # YouTube/Spotify iframe embeds
│       ├── Auth.tsx           # Login/register
│       └── api.ts             # API client with auto-logout on 401
├── Dockerfile.backend         # Multi-stage Go build (alpine)
├── Dockerfile.frontend        # Multi-stage Node build + nginx
├── docker-compose.yml         # Full stack: backend + postgres + frontend
├── fly.toml                   # Fly.io deployment config
├── nginx.conf                 # Frontend SPA routing
└── .github/workflows/
    └── fly-deploy.yml         # CI/CD: auto-deploy on push to main
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
sudo -u postgres psql -d songswap -f migrations/002_chains.sql
sudo -u postgres psql -d songswap -f migrations/003_discoveries_unique.sql
```

### Environment

Create a `.env` file in the project root:

```
DATABASE_URL=postgres://user:password@localhost:5432/songswap?sslmode=disable
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

### Docker Compose (full stack)

```bash
JWT_SECRET=your-secret-here docker compose up --build
```

This spins up the backend, a Postgres instance, and the frontend behind nginx. The app is available at `http://localhost:3000`.

## API Endpoints

| Method   | Route                         | Auth | Description                      |
| -------- | ----------------------------- | ---- | -------------------------------- |
| `POST`   | `/register`                   | No   | Create an account                |
| `POST`   | `/login`                      | No   | Get a JWT token                  |
| `POST`   | `/songs`                      | Yes  | Submit a song to the pool        |
| `GET`    | `/discover`                   | Yes  | Get a random unseen song         |
| `POST`   | `/songs/{id}/like`            | Yes  | Like a discovered song           |
| `DELETE` | `/songs/{id}/like`            | Yes  | Unlike a song                    |
| `GET`    | `/history`                    | Yes  | Get your discovery history       |
| `GET`    | `/chains`                     | No   | List all chains with song counts |
| `POST`   | `/chains`                     | Yes  | Create a new chain               |
| `GET`    | `/chains/{id}/songs`          | No   | Get all songs in a chain         |
| `POST`   | `/chains/{id}/songs`          | Yes  | Add a song to a chain            |
| `DELETE` | `/chains/{id}/songs/{songId}` | Yes  | Remove a song from a chain       |
| `GET`    | `/health`                     | No   | Health check                     |

## Roadmap

- [x] JWT authentication
- [x] Embedded players (YouTube, Spotify)
- [x] Themed chains
- [x] Unit tests (handlers, middleware, rate limiter)
- [x] Docker Compose setup
- [x] CI/CD with GitHub Actions
- [ ] Production deployment (Fly.io + Vercel)
- [ ] Reactions (let the sender know their song landed)
- [ ] Mobile-responsive design
- [ ] Tailwind CSS migration

## License

MIT
