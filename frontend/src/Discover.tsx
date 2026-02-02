import { useState } from "react";
import { discover, likeSong, submitSong } from "./api";

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
    <div style={styles.container}>
      <h1>songswap</h1>

      {song ? (
        <div style={styles.songCard}>
          {song.context_crumb && (
            <p style={styles.context}>"{song.context_crumb}"</p>
          )}
          <a
            href={song.url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            {song.url}
          </a>
          <div style={styles.actions}>
            <button
              onClick={handleLike}
              style={styles.likeButton}
              disabled={liked}
            >
              {liked ? "♥ liked" : "♡ like"}
            </button>
            <button onClick={handleDiscover} style={styles.button}>
              next →
            </button>
          </div>
        </div>
      ) : (
        <button onClick={handleDiscover} style={styles.bigButton}>
          discover a song
        </button>
      )}

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.submitSection}>
        {showSubmit ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="paste a song link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="context crumb (optional)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              style={styles.input}
            />
            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => setShowSubmit(false)}
                style={styles.cancelButton}
              >
                cancel
              </button>
              <button type="submit" style={styles.button}>
                submit
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowSubmit(true)} style={styles.textButton}>
            + add a song to the pool
          </button>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    minHeight: "100vh",
  },
  songCard: {
    marginTop: "40px",
    padding: "30px",
    background: "#1a1a1a",
    borderRadius: "12px",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
  },
  context: {
    color: "#888",
    fontStyle: "italic",
    marginBottom: "20px",
  },
  link: {
    color: "#60a5fa",
    wordBreak: "break-all",
  },
  actions: {
    marginTop: "30px",
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  button: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
  },
  likeButton: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "transparent",
    color: "#e0e0e0",
    cursor: "pointer",
  },
  bigButton: {
    marginTop: "60px",
    padding: "20px 40px",
    borderRadius: "12px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
  },
  error: {
    color: "#ef4444",
    marginTop: "20px",
  },
  submitSection: {
    marginTop: "60px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "300px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#e0e0e0",
  },
  formActions: {
    display: "flex",
    gap: "12px",
  },
  cancelButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "transparent",
    color: "#888",
    cursor: "pointer",
  },
  textButton: {
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
  },
};
