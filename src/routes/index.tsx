import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Loader2, Film } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SceneCard, type Scene } from "@/components/scene-card";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Storyboard AI · Genera escenas con Nano Banana 2" },
      {
        name: "description",
        content:
          "Pega tu guion y obtén un storyboard visual generado escena por escena con IA. Powered by Nano Banana 2.",
      },
    ],
  }),
});

async function callJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("rate_limited");
    if (res.status === 402) throw new Error("payment_required");
    throw new Error(await res.text());
  }
  return res.json() as Promise<T>;
}

function handleAiError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "rate_limited") {
    toast.error("Demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.");
  } else if (msg === "payment_required") {
    toast.error("Se agotaron los créditos de Lovable AI. Añade créditos en Settings → Workspace → Usage.");
  } else {
    toast.error("Algo salió mal. Inténtalo de nuevo.");
  }
}

function Index() {
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [splitting, setSplitting] = useState(false);

  const handleSplit = async () => {
    if (script.trim().length < 10) {
      toast.error("Pega un guion más extenso");
      return;
    }
    setSplitting(true);
    try {
      const data = await callJson<{
        scenes: Array<{ title: string; description: string; visualPrompt: string }>;
      }>("/api/split-scenes", { script });
      setScenes(
        data.scenes.map((s, i) => ({
          id: `${Date.now()}-${i}`,
          index: i,
          title: s.title,
          description: s.description,
          visualPrompt: s.visualPrompt,
          status: "idle",
        })),
      );
      toast.success(`${data.scenes.length} escenas detectadas`);
    } catch (err) {
      handleAiError(err);
    } finally {
      setSplitting(false);
    }
  };

  const updateScene = (id: string, patch: Partial<Scene>) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const generateOne = async (id: string) => {
    const scene = scenes.find((s) => s.id === id);
    if (!scene) return;
    updateScene(id, { status: "loading", error: undefined });
    try {
      const data = await callJson<{ imageUrl: string }>("/api/generate-image", {
        prompt: scene.visualPrompt,
      });
      updateScene(id, { status: "done", imageUrl: data.imageUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      updateScene(id, { status: "error", error: "Falló la generación" });
      handleAiError(err);
      if (msg === "payment_required") throw err;
    }
  };

  const [generatingAll, setGeneratingAll] = useState(false);
  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    try {
      for (const s of scenes) {
        if (s.status === "done") continue;
        try {
          await generateOne(s.id);
        } catch {
          break;
        }
      }
    } finally {
      setGeneratingAll(false);
    }
  };

  const reset = () => {
    setScenes([]);
    setScript("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Film className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Storyboard AI</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Powered by Nano Banana 2
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <AnimatePresence mode="wait">
          {scenes.length === 0 ? (
            <motion.section
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-3xl pt-16 text-center sm:pt-24"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                IA visual para guionistas y creadores
              </div>
              <h1 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
                Convierte tu guion en
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  un storyboard visual
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Pega tu guion. La IA lo divide en escenas y tú generas cada imagen con un clic
                usando Nano Banana 2.
              </p>

              <div className="mt-10 rounded-2xl border border-border bg-card/60 p-2 shadow-[var(--shadow-elegant)] backdrop-blur-xl">
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Pega aquí tu guion completo…"
                  rows={10}
                  className="resize-none border-0 bg-transparent text-left text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
                <div className="flex items-center justify-between border-t border-border px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    {script.length.toLocaleString()} caracteres
                  </span>
                  <Button
                    onClick={handleSplit}
                    disabled={splitting || script.trim().length < 10}
                    className="bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90"
                  >
                    {splitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analizando…
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Dividir en escenas
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="scenes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-8"
            >
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {scenes.length} escenas
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Genera cada imagen individualmente o todas a la vez.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="border-border bg-card/40 backdrop-blur"
                  >
                    Nuevo guion
                  </Button>
                  <Button
                    onClick={handleGenerateAll}
                    disabled={generatingAll}
                    className="bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90"
                  >
                    {generatingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generando…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generar todas
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {scenes.map((scene) => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    onPromptChange={(p) => updateScene(scene.id, { visualPrompt: p })}
                    onGenerate={() => void generateOne(scene.id)}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
