import { describe, expect, it } from "vitest";
import { extractYouTubeVideoId } from "./youtube";

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
