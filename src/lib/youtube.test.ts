import { describe, expect, it } from "vitest";
import { extractYouTubePlaylistId, extractYouTubeVideoId } from "./youtube";

describe("extractYouTubeVideoId", () => {
  const id = "dQw4w9WgXcQ";
  it.each([
    [`https://www.youtube.com/watch?v=${id}`, id],
    [`https://youtu.be/${id}`, id],
    [`https://www.youtube.com/embed/${id}`, id],
    [`https://www.youtube.com/shorts/${id}`, id],
  ])("extrai de %s", (url, expected) => expect(extractYouTubeVideoId(url)).toBe(expected));

  it("rejeita URL inválida", () => expect(extractYouTubeVideoId("https://example.com/video")).toBeNull());
});

describe("extractYouTubePlaylistId", () => {
  const playlistId = "PL123abc_DEF-456";

  it.each([
    [`https://www.youtube.com/playlist?list=${playlistId}`, playlistId],
    [`youtube.com/playlist?list=${playlistId}`, playlistId],
    [`https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=${playlistId}`, playlistId],
    [`https://youtu.be/dQw4w9WgXcQ?list=${playlistId}`, playlistId],
  ])("extrai de %s", (url, expected) => expect(extractYouTubePlaylistId(url)).toBe(expected));

  it("rejeita URL sem parâmetro list", () => {
    expect(extractYouTubePlaylistId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });
});
