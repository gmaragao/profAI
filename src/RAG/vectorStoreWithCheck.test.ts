import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomVectorStore } from "./vectorStoreWithCheck";

vi.mock("@langchain/community/document_loaders/fs/pdf");
vi.mock("@langchain/ollama");
vi.mock("@langchain/qdrant");
vi.mock("@qdrant/js-client-rest");
vi.mock("fs");
vi.mock("path");
vi.mock("crypto");
vi.mock("url", () => ({
  fileURLToPath: vi.fn((url) => "/mocked/path/to/file"),
}));

describe("CustomVectorStore with file hash checking", () => {
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

    // Mock crypto hash
    const mockHash = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue("test-hash"),
    };
    vi.mocked(crypto.createHash).mockReturnValue(mockHash as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("processPDFs with hash checking", () => {
    it("should skip processing when no PDFs found", async () => {
      // Mock directory reading with no PDFs
      vi.mocked(fs.readdirSync).mockReturnValue(["file.txt", "image.jpg"]);
      mockQdrantClient.getCollections.mockResolvedValue({ collections: [] });

      await vectorStore.processPDFs();

      expect(fs.readdirSync).toHaveBeenCalled();
      expect(PDFLoader).not.toHaveBeenCalled();
      expect(QdrantVectorStore.fromDocuments).not.toHaveBeenCalled();
    });

    it("should skip unchanged PDFs based on hash", async () => {
      // Mock directory reading with one PDF
      vi.mocked(fs.readdirSync).mockReturnValue(["document.pdf"]);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("pdf content"));

      // Mock existing collection with matching hash
      mockQdrantClient.getCollections.mockResolvedValue({
        collections: [{ name: "knowledge_document" }],
      });

      mockQdrantClient.scroll.mockResolvedValue({
        points: [{ payload: { fileHash: "test-hash" } }],
      });

      await vectorStore.processPDFs();

      expect(fs.readdirSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(crypto.createHash).toHaveBeenCalledWith("md5");
      expect(PDFLoader).not.toHaveBeenCalled();
      expect(QdrantVectorStore.fromDocuments).not.toHaveBeenCalled();
    });

    it("should re-process PDFs with changed hash", async () => {
      // Mock directory reading with one PDF
      vi.mocked(fs.readdirSync).mockReturnValue(["document.pdf"]);
      vi.mocked(fs.readFileSync).mockReturnValue(
        Buffer.from("updated pdf content")
      );

      // Mock existing collection with different hash
      mockQdrantClient.getCollections.mockResolvedValue({
        collections: [{ name: "knowledge_document" }],
      });

      mockQdrantClient.scroll.mockResolvedValue({
        points: [{ payload: { fileHash: "old-hash" } }],
      });

      // Mock PDF loading
      const mockLoader = {
        load: vi.fn().mockResolvedValue(["doc1", "doc2"]),
      };
      vi.mocked(PDFLoader).mockImplementation(() => mockLoader);

      // Mock text splitter
      const mockSplitter = {
        splitDocuments: vi.fn().mockResolvedValue(["chunk1", "chunk2"]),
      };
      vi.spyOn(
        require("langchain/text_splitter"),
        "RecursiveCharacterTextSplitter"
      ).mockImplementation(() => mockSplitter);

      // Mock vector store creation
      vi.mocked(QdrantVectorStore.fromDocuments).mockResolvedValue({});

      await vectorStore.processPDFs();

      expect(fs.readdirSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(mockQdrantClient.deleteCollection).toHaveBeenCalledWith(
        "knowledge_document",
        { timeout: 10 }
      );
      expect(PDFLoader).toHaveBeenCalled();
      expect(mockLoader.load).toHaveBeenCalled();
      expect(mockSplitter.splitDocuments).toHaveBeenCalled();
      expect(QdrantVectorStore.fromDocuments).toHaveBeenCalledWith(
        ["chunk1", "chunk2"],
        expect.any(OllamaEmbeddings),
        expect.objectContaining({
          url: "http://localhost:6333",
          collectionName: "knowledge_document",
          customPayload: [{ fileHash: "test-hash" }],
        })
      );
    });

    it("should process new PDF files with hash", async () => {
      // Mock directory reading with one new PDF
      vi.mocked(fs.readdirSync).mockReturnValue(["new_document.pdf"]);
      vi.mocked(fs.readFileSync).mockReturnValue(
        Buffer.from("new pdf content")
      );

      // Mock no existing collections
      mockQdrantClient.getCollections.mockResolvedValue({
        collections: [],
      });

      // Mock PDF loading
      const mockLoader = {
        load: vi.fn().mockResolvedValue(["doc1", "doc2"]),
      };
      vi.mocked(PDFLoader).mockImplementation(() => mockLoader);

      // Mock text splitter
      const mockSplitter = {
        splitDocuments: vi.fn().mockResolvedValue(["chunk1", "chunk2"]),
      };
      vi.spyOn(
        require("langchain/text_splitter"),
        "RecursiveCharacterTextSplitter"
      ).mockImplementation(() => mockSplitter);

      // Mock vector store creation
      vi.mocked(QdrantVectorStore.fromDocuments).mockResolvedValue({});

      await vectorStore.processPDFs();

      expect(fs.readdirSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(crypto.createHash).toHaveBeenCalledWith("md5");
      expect(PDFLoader).toHaveBeenCalled();
      expect(mockLoader.load).toHaveBeenCalled();
      expect(mockSplitter.splitDocuments).toHaveBeenCalled();
      expect(QdrantVectorStore.fromDocuments).toHaveBeenCalledWith(
        ["chunk1", "chunk2"],
        expect.any(OllamaEmbeddings),
        expect.objectContaining({
          url: "http://localhost:6333",
          collectionName: "knowledge_new_document",
          customPayload: [{ fileHash: "test-hash" }],
        })
      );
    });
  });
});
