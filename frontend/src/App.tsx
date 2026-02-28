import { useState } from "react";
import Auth from "./Auth";
import Discover from "./Discover";
import History from "./History";
import "./App.css";
import Chains from "./Chains";
import type { Chain } from "./api";

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem("username"),
  );
  const [page, setPage] = useState<"discover" | "history" | "chains">(
    "discover",
  );
  const [activeChain, setActiveChain] = useState<Chain | null>(null);

  function handleLogin(token: string, username: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setToken(token);
    setUsername(username);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername(null);
  }

  function handleSelectChain(chain: Chain) {
    setActiveChain(chain);
    setPage("discover");
  }

  function handleClearChain() {
    setActiveChain(null);
  }

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div
          className="app-logo"
          onClick={() => {
            setPage("discover");
            setActiveChain(null);
          }}
          style={{ cursor: "pointer" }}
        >
          song<span>swap</span>
        </div>
        <nav className="app-nav">
          <button
            onClick={() => {
              setPage("discover");
              setActiveChain(null);
            }}
            className={`app-tab ${page === "discover" ? "active" : ""}`}
          >
            discover
          </button>
          <button
            onClick={() => setPage("chains")}
            className={`app-tab ${page === "chains" ? "active" : ""}`}
          >
            chains
          </button>
          <button
            onClick={() => setPage("history")}
            className={`app-tab ${page === "history" ? "active" : ""}`}
          >
            history
          </button>
        </nav>
        <div className="app-header-right">
          <span className="app-username">{username}</span>
          <button onClick={handleLogout} className="app-logout">
            logout
          </button>
        </div>
      </header>

      {page === "discover" ? (
        <Discover
          token={token}
          activeChain={activeChain}
          onClearChain={handleClearChain}
        />
      ) : page === "chains" ? (
        <Chains token={token} onSelectChain={handleSelectChain} />
      ) : (
        <History token={token} />
      )}
    </div>
  );
}

export default App;
