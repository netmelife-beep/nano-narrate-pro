
# Generador de escenas con Nano Banana 2

App web de una sola página con estética premium tipo ChatGPT/Linear donde pegas un guion, la IA lo divide automáticamente en escenas, y cada escena tiene su propio botón para generar (y regenerar) la imagen con Nano Banana 2.

## Flujo del usuario

1. Llega a la landing/app con un textarea grande para pegar el guion.
2. Pulsa "Dividir en escenas" → Lovable AI (Gemini 3 Flash) analiza el guion y devuelve un array estructurado de escenas: `{ titulo, descripcion, prompt_visual }`.
3. Aparece una grilla/lista de tarjetas, una por escena, mostrando título + descripción + el prompt visual sugerido (editable).
4. Cada tarjeta tiene un botón **Generar imagen**. Al pulsarlo:
   - Se llama al backend que invoca Nano Banana 2 (`google/gemini-3.1-flash-image-preview`) con el prompt visual de esa escena.
   - La tarjeta muestra estado loading → imagen final.
   - Botones secundarios: **Regenerar**, **Descargar**, **Copiar prompt**.
5. Botón global "Generar todas" como atajo opcional que dispara cada tarjeta secuencialmente.
6. Sin login ni persistencia: todo vive en memoria de la sesión.

## Diseño visual (UI)

Aplicar la estética solicitada en el prompt largo: dark mode cinematográfico por defecto, grafito profundo, tipografía sans premium, acentos azul eléctrico, glassmorphism sutil, bordes redondeados, sombras suaves, microinteracciones con framer-motion.

- Layout: header minimalista + área central. En estado inicial: hero con textarea grande centrado. Tras dividir: textarea colapsable arriba + grid responsive de tarjetas (1 col móvil, 2-3 desktop).
- Tarjeta de escena: número de escena, título, descripción corta, prompt visual editable en accordion, área de imagen 16:9 con skeleton mientras carga, acciones al pie.
- Tokens de color añadidos a `src/styles.css` en oklch (background grafito, foreground claro, primary azul eléctrico, accent con leve gradiente).

El estilo del prompt largo aplica solo a la UI de la app — no se inyecta en cada prompt de imagen (las imágenes siguen el contenido del guion).

## Arquitectura técnica

**Frontend (TanStack Start)**
- `src/routes/index.tsx`: pantalla única de la app.
- `src/components/scene-card.tsx`: tarjeta de escena con estados (idle/loading/done/error).
- `src/components/script-input.tsx`: textarea + botón dividir.
- Estado local con `useState` (array de escenas con `id`, `title`, `description`, `prompt`, `status`, `imageUrl`, `error`).
- React Query mutations para llamar a los endpoints.

**Backend (server routes en `src/routes/api/`)**
- `POST /api/split-scenes`: recibe `{ script }`, llama a Lovable AI Gateway con `google/gemini-3-flash-preview` usando structured output (`Output.object` con Zod schema `{ scenes: [{title, description, visualPrompt}] }`). Devuelve el array.
- `POST /api/generate-image`: recibe `{ prompt }`, llama a Lovable AI Gateway con `google/gemini-3.1-flash-image-preview` (Nano Banana 2), devuelve la imagen como data URL base64 para mostrar inmediatamente sin necesitar storage.
- `src/lib/ai-gateway.ts`: helper provider compartido con `@ai-sdk/openai-compatible` apuntando a `https://ai.gateway.lovable.dev/v1` con header `Lovable-API-Key`.

**Manejo de errores**
- 429 → toast "Demasiadas solicitudes, espera un momento".
- 402 → toast "Se agotaron los créditos de Lovable AI, añade créditos en Settings".
- Error genérico → estado error en la tarjeta con botón Reintentar.

## Secretos y dependencias

- `LOVABLE_API_KEY` (auto-provisto, server-side).
- Instalar: `ai`, `@ai-sdk/openai-compatible`, `zod`, `framer-motion`, `sonner` (si no está).

## Lo que NO se incluye (fuera de alcance)

- Login / cuentas / sistema de créditos propio.
- Sidebar de historial, búsqueda en chats, multi-conversación.
- Persistencia en base de datos.
- Streaming de chat conversacional (esto no es un chat, es un generador por lotes).
- Subida de archivos/imágenes de referencia (puede añadirse después).

