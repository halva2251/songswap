import { useState } from "react";
import { login, register } from "./api";
import "./Auth.css";

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
    <div className="auth-container">
      <h1>songswap</h1>
      <p className="auth-tagline">give a song, get a song</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-button">
          {isRegister ? "register" : "login"}
        </button>
      </form>

      <p className="auth-switch">
        {isRegister ? "already have an account? " : "don't have an account? "}
        <span onClick={() => setIsRegister(!isRegister)} className="auth-link">
          {isRegister ? "login" : "register"}
        </span>
      </p>
    </div>
  );
}
