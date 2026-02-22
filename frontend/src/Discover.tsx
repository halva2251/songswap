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
      <h1>songswap</h1>

      {song ? (
        <div className="discover-song-card">
          {song.context_crumb && (
            <p className="discover-context">"{song.context_crumb}"</p>
          )}
          <EmbedPlayer url={song.url} />
          <div className="discover-actions">
            <button
              onClick={handleLike}
              className="discover-like-button"
              disabled={liked}
            >
              {liked ? "♥ liked" : "♡ like"}
            </button>
            <button onClick={handleDiscover} className="discover-button">
              next →
            </button>
          </div>
        </div>
      ) : (
        <button onClick={handleDiscover} className="discover-big-button">
          discover a song
        </button>
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
              <button type="submit" className="discover-button">
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
