import { useEffect, useState } from "react";
import { getHistory } from "./api";

interface Song {
  id: number;
  url: string;
  platform: string;
  context_crumb: string | null;
  created_at: string;
}

interface Discovery {
  song: Song;
  liked: boolean | null;
  discovered_at: string;
}

interface HistoryProps {
  token: string;
}

export default function History({ token }: HistoryProps) {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getHistory(token);
        setDiscoveries(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return <p style={{ padding: "40px", textAlign: "center" }}>loading...</p>;
  }

  if (discoveries.length === 0) {
    return (
      <p style={{ padding: "40px", textAlign: "center" }}>no discoveries yet</p>
    );
  }

  return (
    <div style={styles.list}>
      {discoveries.map((d) => (
        <div key={d.song.id} style={styles.item}>
          <div style={styles.left}>
            {d.song.context_crumb && (
              <span style={styles.context}>"{d.song.context_crumb}"</span>
            )}
            <a
              href={d.song.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              {d.song.url}
            </a>
          </div>
          <div style={styles.right}>
            {d.liked && <span style={styles.heart}>♥</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "600px",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "#1a1a1a",
    borderRadius: "8px",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    overflow: "hidden",
  },
  context: {
    color: "#888",
    fontStyle: "italic",
    fontSize: "14px",
  },
  link: {
    color: "#60a5fa",
    fontSize: "14px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  right: {
    marginLeft: "16px",
  },
  heart: {
    color: "#ef4444",
  },
};
