import { useEffect, useState } from "react";
import { getHistory } from "./api";
import "./History.css";

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
    return <p className="history-loading">loading...</p>;
  }

  if (discoveries.length === 0) {
    return <p className="history-empty">no discoveries yet</p>;
  }

  return (
    <div className="history-list">
      {discoveries.map((d) => (
        <div key={d.song.id} className="history-item">
          <div className="history-left">
            {d.song.context_crumb && (
              <span className="history-context">"{d.song.context_crumb}"</span>
            )}
            <a
              href={d.song.url}
              target="_blank"
              rel="noopener noreferrer"
              className="history-link"
            >
              {d.song.url}
            </a>
          </div>
          <div className="history-right">
            {d.liked && <span className="history-heart">♥</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
