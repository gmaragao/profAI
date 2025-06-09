import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import fs from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import { fileURLToPath } from "url";

export class CustomVectorStore {
  private qdrantUrl: string;
  private collectionPrefix: string;
  private vectorStoreClient: QdrantClient;

  constructor() {
    this.qdrantUrl = "http://localhost:6333"; // Qdrant instance URL
    this.collectionPrefix = "knowledge_"; // Prefix for collection names
    this.vectorStoreClient = new QdrantClient({ url: this.qdrantUrl });
  }
  public async processPDFs() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const pdfDirectory = path.join(__dirname, "../KnowledgeBase");

    const collectionsResult: {
      collections: {
        name: string;
      }[];
    } = await this.vectorStoreClient.getCollections();

    const pdfFiles = fs
      .readdirSync(pdfDirectory)
      .filter((file) => file.endsWith(".pdf"));

    if (pdfFiles.length === 0) {
      console.log("No PDF files found in the KnowledgeBase directory.");
      return;
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    for (const pdfFile of pdfFiles) {
      const collectionName = `${this.collectionPrefix}${path
        .basename(pdfFile, ".pdf")
        .toLowerCase()}`;

      console.log(`Processing PDF: ${pdfFile}`);
      console.log(`Target collection: ${collectionName}`);

      // Check if the collection already exists in Qdrant

      const collectionExists = collectionsResult.collections.some(
        (collection) => collection.name === collectionName
      );

      if (collectionExists) {
        console.log(
          `Collection "${collectionName}" already exists. Skipping vector store creation.`
        );
        continue;
      }

      // Load and process the PDF
      const loader = new PDFLoader(path.join(pdfDirectory, pdfFile));
      const docs = await loader.load();
      const chunks = await splitter.splitDocuments(docs);

      // Create a vector store for the PDF
      console.log(`Creating vector store for collection: ${collectionName}`);
      await QdrantVectorStore.fromDocuments(chunks, new OllamaEmbeddings(), {
        url: this.qdrantUrl,
        collectionName,
      });

      console.log(`Vector store created for collection: ${collectionName}`);
    }
  }

  public async searchSubjectMetadata(query: string): Promise<string> {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      new OllamaEmbeddings(),
      {
        url: this.qdrantUrl,
        collectionName: "knowledge_subject_metadata",
      }
    );
    console.log("Retrieving relevant knowledge for query: ", query);
    const docs = await vectorStore.similaritySearch(query);
    console.log("Retrieved documents: ", docs);

    return docs.map((d: { pageContent: string }) => d.pageContent).join("\n");
  }

  public async searchSubjectKnowledge(query: string): Promise<string> {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      new OllamaEmbeddings(),
      {
        url: this.qdrantUrl,
        collectionName: "knowledge_subject_knowledge",
      }
    );
    console.log("Retrieving relevant knowledge for query: ", query);
    const docs = await vectorStore.similaritySearch(query);
    console.log("Retrieved documents: ", docs);

    return docs.map((d: { pageContent: string }) => d.pageContent).join("\n");
  }
}
