import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { OpenAI } from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import "dotenv/config";

const {
  OPENAI_API_KEY,
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const soccerData: string[] = [
  "https://es.wikipedia.org/wiki/Categor%C3%ADa_Primera_A",
  "https://www.futbolred.com/futbol-colombiano",
  "https://www.winsports.co/futbol-colombiano/noticias",
  "https://www.eltiempo.com/deportes/futbol-colombiano",
  "https://www.elespectador.com/deportes/futbol-colombiano/",
  "https://colombia.as.com/noticias/liga-colombiana/",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN || "");
const db = client.db(ASTRA_DB_API_ENDPOINT || "", {
  namespace: ASTRA_DB_NAMESPACE || "",
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async () => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION || "", {
    vector: {
      dimension: 1536,
      metric: "dot_product",
    },
  });

  console.log("createCollection", res);
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION || "");
  for await (const url of soccerData) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);
    for await (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const vector = embedding.data[0].embedding;

      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
      });

      console.log("loadSampleData", res);
    }
  }
};

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });

  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
};

createCollection().then(() => loadSampleData());
