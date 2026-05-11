import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const { prompt } = (await request.json()) as { prompt?: string };
          if (!prompt || typeof prompt !== "string") {
            return new Response("Prompt requerido", { status: 400 });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
            },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-image-preview",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("image gen error", res.status, text);
            if (res.status === 429) return new Response("rate_limited", { status: 429 });
            if (res.status === 402) return new Response("payment_required", { status: 402 });
            return new Response("Error generando imagen", { status: 500 });
          }

          const data = (await res.json()) as {
            choices?: Array<{
              message?: {
                images?: Array<{ image_url?: { url?: string } }>;
              };
            }>;
          };

          const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!imageUrl) {
            return new Response("No se devolvió imagen", { status: 500 });
          }
          return Response.json({ imageUrl });
        } catch (err) {
          console.error("generate-image error", err);
          return new Response("Error generando imagen", { status: 500 });
        }
      },
    },
  },
});