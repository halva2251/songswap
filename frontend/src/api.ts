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

export async function submitSong(
  url: string,
  contextCrumb?: string,
  chainId?: number,
) {
  const res = await authFetch(`${API_URL}/songs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      context_crumb: contextCrumb || null,
      chain_id: chainId || null,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function discover(token: string, chainId?: number) {
  const url = chainId
    ? `${API_URL}/discover?chain=${chainId}`
    : `${API_URL}/discover`;
  const res = await authFetch(url, {
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

// Chain types and API functions

export interface Chain {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  creator_name?: string;
  song_count: number;
  created_at: string;
}

export async function getChains(): Promise<Chain[]> {
  const res = await fetch(`${API_URL}/chains`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getChainSongs(chainId: number) {
  const res = await fetch(`${API_URL}/chains/${chainId}/songs`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createChain(
  token: string,
  name: string,
  description?: string,
): Promise<Chain> {
  const res = await authFetch(`${API_URL}/chains`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description: description || null }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addSongToChain(
  token: string,
  chainId: number,
  songId: number,
) {
  const res = await authFetch(`${API_URL}/chains/${chainId}/songs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ song_id: songId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function removeSongFromChain(
  token: string,
  chainId: number,
  songId: number,
) {
  const res = await authFetch(`${API_URL}/chains/${chainId}/songs/${songId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
