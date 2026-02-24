const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function register(username: string, password: string) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitSong(url: string, contextCrumb?: string) {
  const res = await authFetch(`${API_URL}/songs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, context_crumb: contextCrumb || null }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function discover(token: string) {
  const res = await authFetch(`${API_URL}/discover`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function likeSong(token: string, songId: number) {
  const res = await authFetch(`${API_URL}/songs/${songId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getHistory(token: string) {
  const res = await authFetch(`${API_URL}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function authFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.reload();
  }
  return res;
}
