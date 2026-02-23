import { useEffect, useState } from "react";
import { getHistory } from "./api";
import "./History.css";
import EmbedPlayer from "./EmbedPlayer";

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
    <div className="history-container">
      <div className="history-title">your discoveries</div>
      <div className="history-list">
        {discoveries.map((d) => (
          <div key={d.song.id} className="history-card">
            <div className="history-card-top">
              <span className="history-context">
                {d.song.context_crumb ? `"${d.song.context_crumb}"` : ""}
              </span>
              {d.liked && <span className="history-heart">♥</span>}
            </div>
            <div className="history-embed">
              <EmbedPlayer url={d.song.url} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
