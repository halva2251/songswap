import { useState } from "react";
import Auth from "./Auth";
import Discover from "./Discover";
import History from "./History";
import "./App.css";

const styles = {
  header: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "12px",
    padding: "12px 20px",
  },
  username: {
    color: "#888",
    fontSize: "14px",
  },
  logoutButton: {
    background: "none",
    border: "1px solid #333",
    color: "#888",
    padding: "4px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
  },
};

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
      <header style={styles.header}>
        <span style={styles.username}>{username}</span>
        <button onClick={handleLogout} style={styles.logoutButton}>
          logout
        </button>
      </header>
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
