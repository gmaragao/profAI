import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import crypto from "crypto";
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

    const pdfDirectory = path.join(__filename, "../../KnowledgeBase");

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

      const filePath = path.join(pdfDirectory, pdfFile);
      const fileBuffer = fs.readFileSync(filePath);
      const currentHash = crypto
        .createHash("md5")
        .update(fileBuffer)
        .digest("hex");

      // Check if the collection already exists in Qdrant
      const existingCollection = collectionsResult.collections.find(
        (collection) => collection.name === collectionName
      );

      if (existingCollection !== undefined && existingCollection.name !== "") {
        const qdrantResponse = await this.vectorStoreClient.scroll(
          existingCollection.name,
          {
            limit: 1,
            with_payload: true,
          }
        );
        const storedHash = qdrantResponse?.points[0]?.payload?.fileHash || "";

        if (storedHash === currentHash) {
          console.log(
            `Collection "${collectionName}" is up-to-date. Skipping vector store creation.`
          );
          continue;
        } else {
          console.log(
            `Collection "${collectionName}" exists but the file has been updated. Recreating vector store.`
          );
          // Optionally, delete the existing collection if needed
          await this.vectorStoreClient.deleteCollection(collectionName, {
            timeout: 10,
          });
        }
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
        customPayload: [
          { fileHash: currentHash }, // Store the file hash in the payload
        ],
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
