import { openai as openaiSDK } from "@ai-sdk/openai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { streamText } from "ai";
import { OpenAI } from "openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const requiredEnv = [
  "ASTRA_DB_NAMESPACE",
  "ASTRA_DB_COLLECTION",
  "ASTRA_DB_API_ENDPOINT",
  "ASTRA_DB_APPLICATION_TOKEN",
  "OPENAI_API_KEY",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT || "", {
  namespace: ASTRA_DB_NAMESPACE,
});

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    const latestMessage = messages[messages?.length - 1]?.content;
    console.log("latest mesagge", latestMessage);
    if (!latestMessage) {
      return new Response("No message content provided", { status: 400 });
    }

    let docContext = "";

    ///create embeding
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    });

    try {
      ///Retrieve context from AstraDB
      const collection = await db.collection(ASTRA_DB_COLLECTION || "");

      const docsMap = await collection
        .find({}, { sort: { $vector: embedding.data[0].embedding }, limit: 20 })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((doc: any) => doc.text)
        .toArray();

      docContext = docsMap?.length ? JSON.stringify(docsMap) : "";

      // const foundDoc = await collection.findOne(
      //   {},
      //   { sort: { $vector: embedding.data[0].embedding } }
      // );
      // const docsMap = foundDoc ? [foundDoc.text] : [];

      // docContext = docsMap?.length ? JSON.stringify(docsMap) : "";

      console.log("CONTEXT", docContext);
    } catch (error) {
      console.error("Error processing db:", error);
    }
    const template = {
      role: "system",
      content: `
      Eres un asistente experto en todo lo relacionado con el fútbol colombiano en idioma español.
      Utiliza el CONTEXTO proporcionado a continuación para complementar tus conocimientos sobre el tema. El contexto incluye datos actualizados de páginas como Wikipedia, revistas deportivas colombianas y otras fuentes.
      Si el contexto no contiene la información que necesitas, responde basándote en tus conocimientos existentes, pero no menciones la fuente de tu información ni indiques si el contexto contiene o no la información requerida.
      Da formato a las respuestas usando markdown cuando sea aplicable y evita incluir imágenes.
      -----------------
      COMIENZO DE CONTEXTO
      ${docContext}
      FIN DE CONTEXTO
      -----------------
      PREGUNTA: ${latestMessage}
      -----------------
      `,
    };
    const result = streamText({
      model: openaiSDK("gpt-4o-mini"),
      messages: [template, ...messages],
    });
    return result.toDataStreamResponse();
  } catch (error) {
    console.log("error...", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
