import { describe, expect, it } from "vitest";
import { readCourseFormValues } from "./course-form-values";

describe("readCourseFormValues", () => {
  it("preserva todos os campos enviados quando um deles precisa ser corrigido", () => {
    const formData = new FormData();
    formData.set("name", "Curso de TypeScript");
    formData.set("description", "Descrição preservada");
    formData.set("url", "url-inválida");
    formData.set("totalLessons", "24");
    formData.set("kind", "COURSE");
    formData.set("subject", "Programação");
    formData.set("tags", "typescript, frontend");

    expect(readCourseFormValues(formData)).toEqual({
      name: "Curso de TypeScript",
      description: "Descrição preservada",
      url: "url-inválida",
      totalLessons: "24",
      kind: "COURSE",
      folderId: "",
      subject: "Programação",
      tags: "typescript, frontend",
    });
  });
});
