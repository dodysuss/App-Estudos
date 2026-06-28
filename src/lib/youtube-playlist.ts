import { extractYouTubePlaylistId, VIDEO_ID_PATTERN } from "./youtube";

export type ImportedPlaylistVideo = {
  videoId: string;
  title: string;
  videoUrl: string;
};

const YOUTUBE_HEADERS = {
  "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
  cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+999",
};

function readBalancedObject(source: string, startIndex: number) {
  const firstBrace = source.indexOf("{", startIndex);
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = firstBrace; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(firstBrace, index + 1);
    }
  }

  return null;
}

function extractJsonAfterMarkers(source: string, markers: string[]) {
  for (const marker of markers) {
    const markerIndex = source.indexOf(marker);
    if (markerIndex === -1) continue;

    const rawJson = readBalancedObject(source, markerIndex + marker.length);
    if (!rawJson) continue;

    try {
      return JSON.parse(rawJson) as unknown;
    } catch {
      continue;
    }
  }

  return null;
}

function textFromRuns(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { simpleText?: unknown; runs?: Array<{ text?: unknown }> };
  if (typeof candidate.simpleText === "string") return candidate.simpleText;
  if (Array.isArray(candidate.runs)) {
    const text = candidate.runs
      .map((run) => (typeof run.text === "string" ? run.text : ""))
      .join("")
      .trim();
    return text || null;
  }
  return null;
}

function walk(value: unknown, visitor: (record: Record<string, unknown>) => void) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor);
    return;
  }

  const record = value as Record<string, unknown>;
  visitor(record);
  for (const child of Object.values(record)) walk(child, visitor);
}

function collectPlaylistVideos(payload: unknown) {
  const videos: ImportedPlaylistVideo[] = [];
  const seen = new Set<string>();

  walk(payload, (record) => {
    const renderer = record.playlistVideoRenderer;
    if (!renderer || typeof renderer !== "object") return;

    const item = renderer as { videoId?: unknown; title?: unknown };
    if (typeof item.videoId !== "string" || !VIDEO_ID_PATTERN.test(item.videoId) || seen.has(item.videoId)) return;

    seen.add(item.videoId);
    videos.push({
      videoId: item.videoId,
      title: textFromRuns(item.title) || `Vídeo ${videos.length + 1}`,
      videoUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
    });
  });

  return videos;
}

function collectFallbackVideoIds(html: string) {
  const videos: ImportedPlaylistVideo[] = [];
  const seen = new Set<string>();
  const matches = html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g);

  for (const match of matches) {
    const videoId = match[1];
    if (seen.has(videoId)) continue;
    seen.add(videoId);
    videos.push({
      videoId,
      title: `Vídeo ${videos.length + 1}`,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }

  return videos;
}

function decodeXmlText(value: string) {
  return value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function collectFeedVideos(xml: string) {
  const videos: ImportedPlaylistVideo[] = [];
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  for (const entry of entries) {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
    if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) continue;

    const rawTitle = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? `Vídeo ${videos.length + 1}`;
    videos.push({
      videoId,
      title: decodeXmlText(rawTitle) || `Vídeo ${videos.length + 1}`,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }

  return videos;
}

async function fetchFeedVideos(playlistId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`, {
      headers: YOUTUBE_HEADERS,
      cache: "no-store",
    });

    if (!response.ok) return [];
    return collectFeedVideos(await response.text());
  } catch {
    return [];
  }
}

function findContinuationToken(payload: unknown, ignoredTokens: Set<string>) {
  let token: string | null = null;

  walk(payload, (record) => {
    if (token) return;
    const renderer = record.continuationItemRenderer;
    if (!renderer || typeof renderer !== "object") return;

    const continuationEndpoint = (renderer as { continuationEndpoint?: unknown }).continuationEndpoint;
    if (!continuationEndpoint || typeof continuationEndpoint !== "object") return;

    const command = (continuationEndpoint as { continuationCommand?: unknown }).continuationCommand;
    if (!command || typeof command !== "object") return;

    const candidate = (command as { token?: unknown }).token;
    if (typeof candidate === "string" && candidate && !ignoredTokens.has(candidate)) token = candidate;
  });

  return token;
}

function extractYtConfig(html: string) {
  const config = extractJsonAfterMarkers(html, ["ytcfg.set("]);
  if (!config || typeof config !== "object") return null;
  const record = config as Record<string, unknown>;
  const apiKey = typeof record.INNERTUBE_API_KEY === "string" ? record.INNERTUBE_API_KEY : null;
  const context = record.INNERTUBE_CONTEXT;
  return apiKey && context && typeof context === "object" ? { apiKey, context } : null;
}

async function fetchContinuationVideos(
  continuation: string,
  config: { apiKey: string; context: unknown },
  ignoredTokens: Set<string>,
) {
  const response = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${config.apiKey}`, {
    method: "POST",
    headers: {
      ...YOUTUBE_HEADERS,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ context: config.context, continuation }),
  });

  if (!response.ok) return { videos: [], nextContinuation: null };

  const payload = (await response.json()) as unknown;
  return {
    videos: collectPlaylistVideos(payload),
    nextContinuation: findContinuationToken(payload, ignoredTokens),
  };
}

export async function importYouTubePlaylistVideos(playlistUrl: string) {
  const playlistId = extractYouTubePlaylistId(playlistUrl);
  if (!playlistId) {
    throw new Error("Informe uma URL válida de playlist do YouTube.");
  }

  const videos = new Map<string, ImportedPlaylistVideo>();
  for (const video of await fetchFeedVideos(playlistId)) videos.set(video.videoId, video);

  const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}&hl=pt-BR&gl=BR`, {
    headers: YOUTUBE_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    if (videos.size > 0) return Array.from(videos.values()).slice(0, 1000);
    throw new Error("Não foi possível acessar a playlist do YouTube.");
  }

  const html = await response.text();
  const initialData = extractJsonAfterMarkers(html, ["var ytInitialData = ", "window[\"ytInitialData\"] = "]);
  const config = extractYtConfig(html);

  if (initialData) {
    for (const video of collectPlaylistVideos(initialData)) videos.set(video.videoId, video);
  }

  for (const video of collectFallbackVideoIds(html)) {
    if (!videos.has(video.videoId)) videos.set(video.videoId, video);
  }

  const ignoredTokens = new Set<string>();
  let continuation = initialData ? findContinuationToken(initialData, ignoredTokens) : null;

  while (continuation && config && videos.size < 1000) {
    ignoredTokens.add(continuation);
    const next = await fetchContinuationVideos(continuation, config, ignoredTokens);
    for (const video of next.videos) {
      if (!videos.has(video.videoId)) videos.set(video.videoId, video);
    }
    continuation = next.nextContinuation;
  }

  const result = Array.from(videos.values()).slice(0, 1000);
  if (!result.length) {
    throw new Error("Não encontrei vídeos públicos nessa playlist. Verifique se a lista é pública e tente novamente.");
  }

  return result;
}
