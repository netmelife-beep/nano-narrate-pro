# Storyboard AI como HTML standalone

Entregar **un único archivo `storyboard.html`** (CSS + JS inline, sin build, sin backend) que replica la app actual y llama directamente a la API pública de Google Gemini desde el navegador usando una API key que el usuario pega.

## Ubicación del archivo

- `/mnt/documents/storyboard.html` → descargable como artefacto.
- Se abre con doble clic en cualquier navegador moderno. Cero dependencias instaladas.

## Funcionalidad incluida (paridad con la app React)

1. Campo para pegar la **Gemini API key** (Google AI Studio). Se guarda en `localStorage` para no repetir.
2. Textarea grande para pegar el guion + botón **Dividir en escenas**.
3. Llama a `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` con el mismo prompt en español que pide exactamente 25 escenas en JSON `{ scenes: [{title, description, visualPrompt}] }`. Parser tolerante a JSON con/ sin markdown (mismo `extractJson` portado).
4. Grid responsive de tarjetas (1/2/3 columnas según viewport). Cada tarjeta:
   - número, título, descripción, prompt visual editable (textarea).
   - área 16:9 con skeleton durante la generación.
   - botones **Generar**, **Regenerar**, **Descargar PNG**, **Copiar prompt**.
5. Botón global **Generar todas** que dispara las tarjetas secuencialmente.
6. Generación de imagen vía `gemini-2.5-flash-image` (Nano Banana) por REST. Devuelve base64 inline → se pinta como `<img src="data:image/png;base64,...">`.
7. Toasts ligeros propios para errores (429 rate limit, 400 key inválida, 402/quota, genérico).
8. Botón **Nuevo guion** para resetear.

## Diseño visual

Mismo lenguaje cinematográfico de la app:
- Dark mode grafito, acento azul eléctrico, gradiente hero, glassmorphism sutil.
- Tipografía: Inter desde Google Fonts (CDN) para no depender de assets.
- Animaciones simples con CSS (fade/slide-in) — sin framer-motion para mantener el archivo en un solo .html.
- Tokens de color y sombras replicados como CSS variables (`--background`, `--primary`, `--gradient-primary`, `--shadow-elegant`, `--shadow-glow`).

## Aviso de seguridad visible en la UI

Banner discreto: *"Tu API key se queda en este navegador (localStorage) y se envía solo a Google. No publiques este HTML con tu key dentro."*

## Detalles técnicos

- HTML semántico: `<header>`, `<main>`, `<section>`, un solo `<h1>`.
- JS vanilla en un único `<script type="module">` con estado en variables (`let scenes = []`) y render imperativo simple.
- Sin frameworks, sin npm, sin Tailwind. Estilos a mano con CSS moderno (grid, oklch, backdrop-filter).
- Endpoints REST de Gemini con header `x-goog-api-key`.
- QA: tras generar el archivo, abriré una captura del HTML renderizado con un navegador headless para verificar layout antes de entregar.

## Fuera de alcance

- No se modifica el proyecto React actual (sigue funcionando en paralelo).
- No hay persistencia de escenas/imágenes entre recargas (igual que la app).
- No se incluye soporte para otros proveedores de IA.
