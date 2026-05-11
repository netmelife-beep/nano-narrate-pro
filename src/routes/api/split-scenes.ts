import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const SceneSchema = z.object({
  scenes: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        visualPrompt: z.string(),
      }),
    )
    .min(1),
});

function extractJson(text: string): unknown {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.search(/[\{\[]/);
  const isArr = start !== -1 && cleaned[start] === "[";
  const end = cleaned.lastIndexOf(isArr ? "]" : "}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  cleaned = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, " ");
    return JSON.parse(cleaned);
  }
}

export const Route = createFileRoute("/api/split-scenes")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const { script } = (await request.json()) as { script?: string };
          if (!script || typeof script !== "string" || script.trim().length < 10) {
            return new Response("Guion demasiado corto", { status: 400 });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");

          const { text } = await generateText({
            model,
            system:
              "Eres un director de cine y storyboard artist. Divides guiones en escenas visualmente distintas. Para cada escena generas un prompt visual rico en inglés, cinematográfico, listo para un modelo de generación de imágenes. Devuelve SIEMPRE únicamente JSON válido sin markdown ni texto adicional.",
            prompt: `Divide el siguiente guion en todas las escenas necesarias (típicamente entre 3 y 12). Cada cambio de lugar, momento o acción importante debe ser una escena nueva.\n\nDevuelve EXACTAMENTE este formato JSON, sin envoltorios ni markdown:\n{\n  "scenes": [\n    {\n      "title": "Título corto en el idioma del guion",\n      "description": "Descripción breve de qué sucede, en el idioma del guion",\n      "visualPrompt": "Detailed cinematic English prompt for image generation: subject, action, setting, lighting, mood, style, composition"\n    }\n  ]\n}\n\nGUION:\n"""\n${script}\n"""`,
          });

          const parsed = SceneSchema.parse(extractJson(text));
          return Response.json(parsed);
        } catch (err) {
          const status = (err as { status?: number })?.status;
          if (status === 429) return new Response("rate_limited", { status: 429 });
          if (status === 402) return new Response("payment_required", { status: 402 });
          console.error("split-scenes error", err);
          return new Response("Error dividiendo escenas", { status: 500 });
        }
      },
    },
  },
});