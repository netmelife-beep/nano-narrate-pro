import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const SceneSchema = z.object({
  scenes: z
    .array(
      z.object({
        title: z.string().describe("Título corto de la escena"),
        description: z.string().describe("Descripción breve de lo que sucede"),
        visualPrompt: z
          .string()
          .describe(
            "Prompt visual detallado en inglés para generar una imagen cinematográfica de esta escena. Incluye sujeto, acción, ambiente, iluminación, estilo, composición.",
          ),
      }),
    )
    .min(1),
});

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

          const { experimental_output } = await generateText({
            model,
            experimental_output: Output.object({ schema: SceneSchema }),
            system:
              "Eres un director de cine y storyboard artist. Divides guiones en escenas visualmente distintas. Para cada escena generas un prompt visual rico en inglés, cinematográfico, listo para un modelo de generación de imágenes. Mantén las descripciones del usuario en su idioma original, pero los visualPrompt SIEMPRE en inglés.",
            prompt: `Divide el siguiente guion en todas las escenas necesarias (entre 3 y 12 normalmente). Cada cambio de lugar, momento o acción importante debe ser una escena nueva.\n\nGUION:\n"""\n${script}\n"""`,
          });

          return Response.json(experimental_output);
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