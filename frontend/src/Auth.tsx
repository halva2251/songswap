import { useState } from "react";
import { login, register } from "./api";

interface AuthProps {
  onLogin: (token: string, username: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const fn = isRegister ? register : login;
      const data = await fn(username, password);
      onLogin(data.token, data.user.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div style={styles.container}>
      <h1>songswap</h1>
      <p style={styles.tagline}>give a song, get a song</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button}>
          {isRegister ? "register" : "login"}
        </button>
      </form>

      <p style={styles.switch}>
        {isRegister ? "already have an account? " : "don't have an account? "}
        <span onClick={() => setIsRegister(!isRegister)} style={styles.link}>
          {isRegister ? "login" : "register"}
        </span>
      </p>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
  },
  tagline: {
    color: "#888",
    marginBottom: "40px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "300px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#e0e0e0",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "#ef4444",
    fontSize: "14px",
  },
  switch: {
    marginTop: "20px",
    color: "#888",
  },
  link: {
    color: "#3b82f6",
    cursor: "pointer",
  },
};
