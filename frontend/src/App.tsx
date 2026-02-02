import { useState } from "react";
import Auth from "./Auth";
import Discover from "./Discover";

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

  return <Discover token={token} />;
}

export default App;
