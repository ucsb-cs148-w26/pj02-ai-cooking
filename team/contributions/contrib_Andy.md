# My Contributions — Team Member Draft

## Overview

I worked on the **Gemini API system** that powers PantryPal's AI features: image detection (scanning ingredients from photos) and recipe generation. My contributions include the API routes, error handling, model fallback logic, streaming progress updates, and the service layer that connects the frontend to the Gemini endpoints. I also added metadata tracking (model used, duration) so users can see how long scans take and which model was used.

---

## Gemini API — Image Detection (Scan)

### Scan API route and service

- **`/api/gemini/scan`** — Implemented the image-scanning endpoint that uses Gemini's vision model to detect ingredients from photos (receipts, produce, etc.). The API accepts base64-encoded images and returns a normalized list of ingredients with names, quantities, categories, and expiry estimates.

- **`services/geminiService.ts`** — Built the `analyzeImage` function that calls the scan API. Added support for streaming progress updates so the UI can show status messages (e.g., "Primary model busy, trying fallback model...") while the request is in progress.

- **`lib/geminiKeys.ts`** — Added `isUnavailableError` to detect 503 and overloaded-model errors, complementing the existing `isRateLimitError` for rate limits. This enables the API to distinguish between retryable (model busy) and non-retryable failures.

### Model fallback and error handling

- **503 / high-demand handling** — When the primary model (gemini-3.1-flash-lite-preview) returns 503 or "high demand," the system automatically downgrades to a stable fallback model (gemini-2.5-flash). If both models fail, the API returns 429 with `canRetry: true` so the frontend can offer a retry with the downgraded model.

- **Multi-key rotation** — The scan and recipe routes support multiple API keys. When one key hits rate limits, the system tries the next key after a delay (4 seconds to align with free-tier RPM limits).

### Scan metadata and UI

- **`ScanAnalysisMeta`** — Introduced `modelUsed` and `durationMs` in the scan response so the app can report which model handled the request and how long it took.

- **`ScanAnalyzer.tsx`** — Updated the scan UI to display the analysis result with a status message like "Finished analyzing in 2.34s using gemini-2.5-flash." The status message persists after the scan completes (not only during loading).

---

## Gemini API — Recipe Generation

### Recipe API route and service

- **`/api/gemini/recipes`** — Implemented the recipe-generation endpoint that takes selected pantry ingredients and user preferences (allergies, diet, cuisine) and returns structured recipes with titles, descriptions, difficulty, time, ingredients, and instructions.

- **`generateRecipes`** — Built the service function that calls the recipes API. Added streaming progress support so users see status updates (e.g., "Trying next API key...") when the primary model is busy or rate-limited.

### Model fallback and retry

- **Same fallback logic as scan** — Recipe generation uses the same primary → downgraded model flow and multi-key rotation. When the primary model returns 503, the system tries the fallback model before failing.

- **`canRetry` flag** — When both models fail, the API returns 429 with `canRetry: true` if the user was not already on the downgraded model. The frontend can then retry with `useDowngradedModel: true`. If the downgraded model itself fails, `canRetry` is false so the user knows to wait before trying again.

### Recipe image generation

- **`generateRecipeImage`** — Each recipe card includes an AI-generated food image. The route uses Gemini's image model (gemini-3.1-flash-image-preview) to produce appetizing, realistic images for each recipe title.

---

## Streaming and Progress

- **`streamProgress`** — Added an optional `streamProgress: true` parameter to both scan and recipe APIs. When enabled, the API returns NDJSON (newline-delimited JSON) instead of a single JSON response. The stream includes `{ type: 'progress', message: '...' }` events for status updates and `{ type: 'error', ... }` for failures, allowing the UI to show real-time feedback without blocking.

- **`requestJsonStreaming`** — Implemented the client-side streaming parser in `geminiService.ts` that consumes the NDJSON stream, forwards progress messages to the callback, and returns the final result (items or recipes) with optional metadata.

---

## Tests

- **`route.test.ts`** (scan and recipes) — Added Vitest tests for the 503 model-downgrade flow: primary model fails → fallback succeeds, both fail → 429 with `canRetry`, and when already on downgraded model → 429 without `canRetry`.

- **`geminiKeys.test.ts`** — Added tests for `isUnavailableError` covering 503, UNAVAILABLE status, "high demand," and "overloaded" messages, and ensuring rate-limit errors are not misclassified.

---

## Notes on Commit Attribution

Some of my contributions may not be fully reflected in the GitHub Contributors graph if commits were made under different account configurations, or if pair programming sessions were committed by another team member. The work described above represents my personal contributions to the Gemini API system and can be verified through the code in `Project/app/api/gemini/`, `Project/services/geminiService.ts`, `Project/lib/geminiKeys.ts`, and `Project/components/ScanAnalyzer.tsx`.

---
