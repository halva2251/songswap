import { useState } from "react";
import Auth from "./Auth";
import Discover from "./Discover";
import History from "./History";
import "./App.css";

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [page, setPage] = useState<"discover" | "history">("discover");

  function handleLogin(token: string, username: string) {
    setToken(token);
    setUsername(username);
  }

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
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

      {page === "discover" ? (
        <Discover token={token} />
      ) : (
        <History token={token} />
      )}
    </div>
  );
}

export default App;
