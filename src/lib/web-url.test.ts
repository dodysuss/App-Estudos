import { describe, expect, it } from "vitest";
import { normalizeWebUrl } from "./web-url";

describe("normalizeWebUrl", () => {
  it("adiciona https a um domínio sem protocolo", () => {
    expect(normalizeWebUrl("plataforma.com/curso")).toBe("https://plataforma.com/curso");
  });

  it("preserva URLs que já possuem protocolo", () => {
    expect(normalizeWebUrl("http://plataforma.com/curso")).toBe("http://plataforma.com/curso");
  });

  it("transforma campo vazio em valor opcional", () => {
    expect(normalizeWebUrl("   ")).toBeUndefined();
  });
});
