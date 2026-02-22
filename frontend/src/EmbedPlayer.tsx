import "./EmbedPlayer.css";

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

function getSpotifyId(url: string): { type: string; id: string } | null {
  const match = url.match(
    /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/,
  );
  return match ? { type: match[1], id: match[2] } : null;
}

interface EmbedPlayerProps {
  url: string;
}

export default function EmbedPlayer({ url }: EmbedPlayerProps) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        className="embed-iframe"
        src={`https://www.youtube.com/embed/${ytId}`}
        title="YouTube player"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    );
  }

  const spotify = getSpotifyId(url);
  if (spotify) {
    return (
      <iframe
        className="embed-iframe-spotify"
        src={`https://open.spotify.com/embed/${spotify.type}/${spotify.id}`}
        title="Spotify player"
        allow="encrypted-media"
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="embed-fallback"
    >
      {url}
    </a>
  );
}
