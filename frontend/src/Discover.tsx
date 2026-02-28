import { useState, useEffect, useRef } from "react";
import { discover, likeSong, submitSong, getChainSongs } from "./api";
import type { Chain } from "./api";
import "./Discover.css";
import EmbedPlayer from "./EmbedPlayer";

interface Song {
  id: number;
  url: string;
  platform: string;
  context_crumb: string | null;
  created_at: string;
}

interface DiscoverProps {
  token: string;
  activeChain?: Chain | null;
  onClearChain?: () => void;
}

export default function Discover({
  token,
  activeChain,
  onClearChain,
}: DiscoverProps) {
  const [song, setSong] = useState<Song | null>(null);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);

  // For submitting songs
  const [showSubmit, setShowSubmit] = useState(false);
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");

  // For chain song list
  const [chainSongs, setChainSongs] = useState<Song[]>([]);
  const [chainLiked, setChainLiked] = useState<Set<number>>(new Set());
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const songRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (activeChain) {
      loadChainSongs();
    } else {
      setChainSongs([]);
    }
  }, [activeChain]);

  async function loadChainSongs() {
    if (!activeChain) return;
    try {
      const data = await getChainSongs(activeChain.id);
      setChainSongs(data);
    } catch {
      setError("Failed to load chain songs");
    }
  }

  function handleShuffle() {
    if (chainSongs.length === 0) return;
    const random = chainSongs[Math.floor(Math.random() * chainSongs.length)];
    setHighlightedId(random.id);
    const el = songRefs.current.get(random.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setHighlightedId(null), 2000);
  }

  async function handleChainLike(songId: number) {
    try {
      await likeSong(token, songId);
      setChainLiked((prev) => new Set(prev).add(songId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to like");
    }
  }

  async function handleDiscover() {
    setError("");
    try {
      const data = await discover(token);
      setSong(data);
      setLiked(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No songs to discover");
    }
  }

  async function handleLike() {
    if (!song) return;
    try {
      await likeSong(token, song.id);
      setLiked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to like");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitSong(url, context || undefined, activeChain?.id);
      setUrl("");
      setContext("");
      setShowSubmit(false);
      // Refresh the chain song list if we're in a chain
      if (activeChain) {
        loadChainSongs();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
  }

  return (
    <div className="discover-container">
      {activeChain && (
        <div className="chain-detail-header">
          <button onClick={onClearChain} className="chain-back-button">
            ← all songs
          </button>
          <div className="chain-detail-info">
            <div className="chain-detail-name">{activeChain.name}</div>
            {activeChain.description && (
              <p className="chain-detail-desc">{activeChain.description}</p>
            )}
          </div>
        </div>
      )}

      {activeChain ? (
        <>
          <div className="chain-controls">
            <span className="chain-song-count">
              {chainSongs.length} {chainSongs.length === 1 ? "song" : "songs"}
            </span>
            {chainSongs.length > 0 && (
              <button onClick={handleShuffle} className="discover-big-button">
                shuffle
              </button>
            )}
          </div>

          {chainSongs.length === 0 ? (
            <div className="chains-empty">
              <p>no songs in this chain yet</p>
            </div>
          ) : (
            <div className="chain-song-list">
              {chainSongs.map((s) => (
                <div
                  key={s.id}
                  ref={(el) => {
                    if (el) songRefs.current.set(s.id, el);
                  }}
                  className={`discover-song-card ${highlightedId === s.id ? "highlighted" : ""}`}
                >
                  {s.context_crumb && (
                    <p className="discover-context">"{s.context_crumb}"</p>
                  )}
                  <div className="discover-embed">
                    <EmbedPlayer url={s.url} />
                  </div>
                  <div className="discover-actions">
                    <button
                      onClick={() => handleChainLike(s.id)}
                      className={`discover-like-button ${chainLiked.has(s.id) ? "liked" : ""}`}
                    >
                      {chainLiked.has(s.id) ? "♥ liked" : "♡ like"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : song ? (
        <div className="discover-song-card">
          {song.context_crumb && (
            <p className="discover-context">"{song.context_crumb}"</p>
          )}
          <div className="discover-embed">
            <EmbedPlayer url={song.url} />
          </div>
          <div className="discover-actions">
            <button
              onClick={handleLike}
              className={`discover-like-button ${liked ? "liked" : ""}`}
            >
              {liked ? "♥ liked" : "♡ like"}
            </button>
            <button onClick={handleDiscover} className="discover-next-button">
              next →
            </button>
          </div>
        </div>
      ) : (
        <div className="discover-empty">
          <div>
            <h2 className="discover-title">discover a song</h2>
            <p className="discover-subtitle">from a stranger, for you</p>
          </div>
          <button onClick={handleDiscover} className="discover-big-button">
            discover
          </button>
        </div>
      )}

      {error && <p className="discover-error">{error}</p>}

      <div className="discover-submit-section">
        {showSubmit ? (
          <form onSubmit={handleSubmit} className="discover-form">
            <input
              type="text"
              placeholder="paste a song link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="discover-input"
            />
            <input
              type="text"
              placeholder="context crumb (optional)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="discover-input"
            />
            <div className="discover-form-actions">
              <button
                type="button"
                onClick={() => setShowSubmit(false)}
                className="discover-cancel-button"
              >
                cancel
              </button>
              <button type="submit" className="discover-submit-button">
                submit
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowSubmit(true)}
            className="discover-text-button"
          >
            {activeChain
              ? `+ add a song to "${activeChain.name}"`
              : "+ add a song to the pool"}
          </button>
        )}
      </div>
    </div>
  );
}
