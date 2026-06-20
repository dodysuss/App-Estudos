import { describe, expect, it } from "vitest";
import { calculateProgress, getNextLesson, getProgressStatus } from "./progress";

describe("progress helpers", () => {
  it("calcula e arredonda o percentual", () => expect(calculateProgress(2, 3)).toBe(67));
  it("trata total zero", () => expect(calculateProgress(0, 0)).toBe(0));
  it("classifica os estados", () => {
    expect(getProgressStatus(0, 3)).toBe("not-started");
    expect(getProgressStatus(1, 3)).toBe("in-progress");
    expect(getProgressStatus(3, 3)).toBe("completed");
  });
  it("encontra a primeira aula pendente", () => {
    expect(getNextLesson([{ lessonNumber: 2, completed: false }, { lessonNumber: 1, completed: true }])).toBe(2);
  });
});
