import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomVectorStore } from "./vectorStore";

// Mock modules
vi.mock("@langchain/community/document_loaders/fs/pdf");
vi.mock("@langchain/ollama");
vi.mock("@langchain/qdrant");
vi.mock("@qdrant/js-client-rest");
vi.mock("fs");
vi.mock("path");
// Add a mock for the text_splitter module
vi.mock("langchain/text_splitter", () => {
  return {
    RecursiveCharacterTextSplitter: vi.fn().mockImplementation(() => ({
      splitDocuments: vi.fn().mockResolvedValue(["chunk1", "chunk2"]),
    })),
  };
});

describe("CustomVectorStore", () => {
  let vectorStore: CustomVectorStore;
  let mockQdrantClient: any;

  beforeEach(() => {
    mockQdrantClient = new QdrantClient({
      url: "http://localhost:6333",
    });
    vi.mocked(QdrantClient).mockImplementation(() => mockQdrantClient);

    vectorStore = new CustomVectorStore();

    // Mock path functions
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
    vi.mocked(path.dirname).mockImplementation((p) =>
      p.split("/").slice(0, -1).join("/")
    );
    vi.mocked(path.basename).mockImplementation((p, ext) => {
      const base = p.split("/").pop();
      return ext ? base.replace(ext, "") : base;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("processPDFs", () => {
    it("should skip processing when no PDFs found", async () => {
      // Mock directory reading with no PDFs
      vi.mocked(fs.readdirSync).mockReturnValue(["file.txt", "image.jpg"]);
      mockQdrantClient.getCollections = vi
        .fn()
        .mockResolvedValue({ collections: [] });

      await vectorStore.processPDFs();

      expect(fs.readdirSync).toHaveBeenCalled();
      expect(PDFLoader).not.toHaveBeenCalled();
      expect(QdrantVectorStore.fromDocuments).not.toHaveBeenCalled();
    });

    it("should skip existing collections", async () => {
      // Mock directory reading with one PDF
      vi.mocked(fs.readdirSync).mockReturnValue(["document.pdf"]);

      // Mock existing collection
      mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
        collections: [{ name: "knowledge_document" }],
      });

      await vectorStore.processPDFs();

      expect(fs.readdirSync).toHaveBeenCalled();
      expect(PDFLoader).not.toHaveBeenCalled();
      expect(QdrantVectorStore.fromDocuments).not.toHaveBeenCalled();
    });

    it("should process new PDF files", async () => {
      // Mock directory reading with one new PDF
      vi.mocked(fs.readdirSync).mockReturnValue(["new_document.pdf"]);

      // Mock no existing collections
      mockQdrantClient.getCollections = vi.fn().mockResolvedValue({
        collections: [],
      });

      // Mock PDF loading
      const mockLoader = {
        load: vi.fn().mockResolvedValue(["doc1", "doc2"]),
      };
      vi.mocked(PDFLoader).mockImplementation(() => mockLoader);

      // Mock vector store creation
      vi.mocked(QdrantVectorStore.fromDocuments).mockResolvedValue({});

      await vectorStore.processPDFs();

      expect(fs.readdirSync).toHaveBeenCalled();
      expect(PDFLoader).toHaveBeenCalled();
      expect(mockLoader.load).toHaveBeenCalled();
      // Instead of checking the splitter directly, we can verify the fromDocuments was called properly
      expect(QdrantVectorStore.fromDocuments).toHaveBeenCalledWith(
        ["chunk1", "chunk2"],
        expect.any(OllamaEmbeddings),
        expect.objectContaining({
          url: "http://localhost:6333",
          collectionName: "knowledge_new_document",
        })
      );
    });
  });

  describe("search methods", () => {
    it("should search subject metadata correctly", async () => {
      const mockVectorStore = {
        similaritySearch: vi
          .fn()
          .mockResolvedValue([
            { pageContent: "Content 1" },
            { pageContent: "Content 2" },
          ]),
      };

      vi.mocked(QdrantVectorStore.fromExistingCollection).mockResolvedValue(
        mockVectorStore as any
      );

      const result = await vectorStore.searchSubjectMetadata("test query");

      expect(QdrantVectorStore.fromExistingCollection).toHaveBeenCalledWith(
        expect.any(OllamaEmbeddings),
        {
          url: "http://localhost:6333",
          collectionName: "knowledge_subject_metadata",
        }
      );
      expect(mockVectorStore.similaritySearch).toHaveBeenCalledWith(
        "test query"
      );
      expect(result).toBe("Content 1\nContent 2");
    });

    it("should search subject knowledge correctly", async () => {
      const mockVectorStore = {
        similaritySearch: vi
          .fn()
          .mockResolvedValue([
            { pageContent: "Knowledge 1" },
            { pageContent: "Knowledge 2" },
          ]),
      };

      vi.mocked(QdrantVectorStore.fromExistingCollection).mockResolvedValue(
        mockVectorStore as any
      );

      const result = await vectorStore.searchSubjectKnowledge("test query");

      expect(QdrantVectorStore.fromExistingCollection).toHaveBeenCalledWith(
        expect.any(OllamaEmbeddings),
        {
          url: "http://localhost:6333",
          collectionName: "knowledge_subject_knowledge",
        }
      );
      expect(mockVectorStore.similaritySearch).toHaveBeenCalledWith(
        "test query"
      );
      expect(result).toBe("Knowledge 1\nKnowledge 2");
    });
  });
});
