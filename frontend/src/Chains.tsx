import { useState, useEffect } from "react";
import { getChains, createChain, type Chain } from "./api";
import "./Chains.css";

interface ChainsProps {
  token: string;
  onSelectChain: (chain: Chain) => void;
}

export default function Chains({ token, onSelectChain }: ChainsProps) {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadChains();
  }, []);

  async function loadChains() {
    try {
      const data = await getChains();
      setChains(data);
    } catch {
      setError("Failed to load chains");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const chain = await createChain(token, name, description || undefined);
      setChains([chain, ...chains]);
      setName("");
      setDescription("");
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chain");
    }
  }

  if (loading) {
    return (
      <div className="chains-container">
        <p className="chains-loading">loading chains...</p>
      </div>
    );
  }

  return (
    <div className="chains-container">
      <div className="chains-header">
        <div>
          <h2 className="chains-title">chains</h2>
          <p className="chains-subtitle">themed collections by the community</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="chains-create-toggle"
        >
          {showCreate ? "cancel" : "+ new chain"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="chains-create-form">
          <input
            type="text"
            placeholder="chain name (e.g. 3am vibes)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="chains-input"
            maxLength={50}
          />
          <input
            type="text"
            placeholder="description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="chains-input"
            maxLength={200}
          />
          <button type="submit" className="chains-create-button">
            create chain
          </button>
        </form>
      )}

      {error && <p className="chains-error">{error}</p>}

      {chains.length === 0 ? (
        <div className="chains-empty">
          <p>no chains yet — be the first to create one</p>
        </div>
      ) : (
        <div className="chains-list">
          {chains.map((chain) => (
            <button
              key={chain.id}
              className="chain-card"
              onClick={() => onSelectChain(chain)}
            >
              <div className="chain-card-top">
                <span className="chain-name">{chain.name}</span>
                <span className="chain-count">
                  {chain.song_count} {chain.song_count === 1 ? "song" : "songs"}
                </span>
              </div>
              {chain.description && (
                <p className="chain-description">{chain.description}</p>
              )}
              <p className="chain-creator">
                by {chain.creator_name || "unknown"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
