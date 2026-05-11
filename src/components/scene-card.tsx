import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Wand2, RefreshCw, Download, Copy, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type SceneStatus = "idle" | "loading" | "done" | "error";

export interface Scene {
  id: string;
  index: number;
  title: string;
  description: string;
  visualPrompt: string;
  status: SceneStatus;
  imageUrl?: string;
  error?: string;
}

interface Props {
  scene: Scene;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
}

export function SceneCard({ scene, onPromptChange, onGenerate }: Props) {
  const [showPrompt, setShowPrompt] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(scene.visualPrompt);
    toast.success("Prompt copiado");
  };

  const handleDownload = () => {
    if (!scene.imageUrl) return;
    const a = document.createElement("a");
    a.href = scene.imageUrl;
    a.download = `escena-${scene.index + 1}.png`;
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: scene.index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-[var(--shadow-elegant)] transition-all hover:border-primary/30"
    >
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
            {String(scene.index + 1).padStart(2, "0")}
          </span>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{scene.title}</h3>
        </div>
      </div>

      <div className="px-5 pb-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{scene.description}</p>
      </div>

      <div className="relative mx-5 mb-4 aspect-video overflow-hidden rounded-xl border border-border bg-background/50">
        {scene.status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/5 to-transparent">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Generando con Nano Banana 2…</span>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          </div>
        )}
        {scene.status === "done" && scene.imageUrl && (
          <motion.img
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            src={scene.imageUrl}
            alt={scene.title}
            className="h-full w-full object-cover"
          />
        )}
        {scene.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <span className="text-xs">{scene.error ?? "Error"}</span>
          </div>
        )}
        {scene.status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Sin generar
          </div>
        )}
      </div>

      <div className="border-t border-border">
        <button
          onClick={() => setShowPrompt((s) => !s)}
          className="flex w-full items-center justify-between px-5 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>Prompt visual</span>
          {showPrompt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showPrompt && (
          <div className="px-5 pb-4">
            <Textarea
              value={scene.visualPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={4}
              className="resize-none border-border bg-background/60 text-xs text-foreground"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-4">
        <Button
          onClick={onGenerate}
          disabled={scene.status === "loading"}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          {scene.status === "loading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : scene.status === "done" ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {scene.status === "loading"
            ? "Generando…"
            : scene.status === "done"
              ? "Regenerar"
              : "Generar imagen"}
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="border-border bg-background/40"
          title="Copiar prompt"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        {scene.status === "done" && (
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="border-border bg-background/40"
            title="Descargar"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}