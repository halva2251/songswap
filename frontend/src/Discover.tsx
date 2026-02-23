import { useState } from "react";
import { discover, likeSong, submitSong } from "./api";
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
}

export default function Discover({ token }: DiscoverProps) {
  const [song, setSong] = useState<Song | null>(null);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);

  // For submitting songs
  const [showSubmit, setShowSubmit] = useState(false);
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");

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
      await submitSong(url, context || undefined);
      setUrl("");
      setContext("");
      setShowSubmit(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
  }

  return (
    <div className="discover-container">
      {song ? (
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
            + add a song to the pool
          </button>
        )}
      </div>
    </div>
  );
}
