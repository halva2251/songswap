import { useState } from "react";
import Auth from "./Auth";

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  function handleLogin(token: string, username: string) {
    setToken(token);
    setUsername(username);
  }

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div>
      <h1>welcome, {username}</h1>
    </div>
  );
}

export default App;
