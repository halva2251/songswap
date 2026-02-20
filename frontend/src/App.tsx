import { useState } from "react";
import Auth from "./Auth";
import Discover from "./Discover";
import History from "./History";

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
    <div style={styles.container}>
      <nav style={styles.nav}>
        <button
          onClick={() => setPage("discover")}
          style={page === "discover" ? styles.activeTab : styles.tab}
        >
          discover
        </button>
        <button
          onClick={() => setPage("history")}
          style={page === "history" ? styles.activeTab : styles.tab}
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

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
  },
  nav: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    padding: "20px",
    borderBottom: "1px solid #222",
  },
  tab: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "16px",
    cursor: "pointer",
  },
  activeTab: {
    background: "none",
    border: "none",
    color: "#e0e0e0",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default App;
