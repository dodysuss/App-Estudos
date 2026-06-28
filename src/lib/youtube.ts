export const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{5,200}$/;

function normalizeYouTubeUrl(value: string) {
  const input = value.trim();
  if (!input) return "";
  return /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`;
}

function getYouTubeHost(value: string) {
  return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
}

export function extractYouTubeVideoId(value: string): string | null {
  const input = normalizeYouTubeUrl(value);
  if (!input) return null;

  try {
    const url = new URL(input);
    const host = getYouTubeHost(input);
    let candidate: string | null = null;

    if (host === "youtu.be") {
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") candidate = url.searchParams.get("v");
      else {
        const [kind, id] = url.pathname.split("/").filter(Boolean);
        if (kind === "embed" || kind === "shorts") candidate = id ?? null;
      }
    }

    return candidate && VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function extractYouTubePlaylistId(value: string): string | null {
  const input = normalizeYouTubeUrl(value);
  if (!input) return null;

  try {
    const url = new URL(input);
    const host = getYouTubeHost(input);
    const isYouTube =
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtu.be";

    if (!isYouTube) return null;

    const playlistId = url.searchParams.get("list");
    return playlistId && PLAYLIST_ID_PATTERN.test(playlistId) ? playlistId : null;
  } catch {
    return null;
  }
}
