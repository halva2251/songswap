import { useState } from "react";
import Auth from "./Auth";
import Discover from "./Discover";
import History from "./History";
import "./App.css";

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem("username"),
  );
  const [page, setPage] = useState<"discover" | "history">("discover");

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

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-logo">
          song<span>swap</span>
        </div>
        <nav className="app-nav">
          <button
            onClick={() => setPage("discover")}
            className={`app-tab ${page === "discover" ? "active" : ""}`}
          >
            discover
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
        <Discover token={token} />
      ) : (
        <History token={token} />
      )}
    </div>
  );
}

export default App;
