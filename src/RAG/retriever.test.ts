import { beforeEach, describe, expect, it } from "vitest";
import { CustomVectorStore } from "./retriever";

describe("CustomVectorStore", () => {
  let vectorStore: CustomVectorStore;

  beforeEach(() => {
    vectorStore = new CustomVectorStore();
  });

  it("should search subject metadata correctly", async () => {
    const query = "Data exame";
    const result = await vectorStore.searchSubjectMetadata(query);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain(
      "Semana 12 (10 de novembro de 2025): Revisão para a Prova Final"
    );
  });

  it("should search subject knowledge correctly", async () => {
    const query = "almodovar";
    const result = await vectorStore.searchSubjectKnowledge(query);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("Fale com ela");
  });
});
