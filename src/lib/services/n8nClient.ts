import { z } from "zod";
import { N8N_WEBHOOK_URL } from "@/lib/env";
import type { N8NImageResult } from "@/lib/definitions";

const N8NResponseSchema = z.object({
  image_url: z.string().url(),
  metadata: z
    .object({
      jobId: z.string().optional(),
      duration_ms: z.number().optional(),
    })
    .optional(),
});

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }
      
      if (response.status >= 400 && response.status < 500) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(`Client error: ${response.status}. ${errorBody.message || ''}`);
      }
      // For 5xx errors, it will retry
      
    } catch (error) {
      if (i === retries) {
        throw error;
      }
      console.warn(`[n8nClient] Attempt ${i + 1} failed. Retrying in ${delay * (i + 1)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("All fetch retries failed.");
}

export async function generateImage(
  prompt: string,
  options?: { style?: string; size?: string }
): Promise<N8NImageResult> {
  if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_URL.startsWith('http')) {
    console.error("N8N_WEBHOOK_URL is not configured correctly.");
    // Return a specific placeholder to indicate configuration error
    return { image_url: `https://picsum.photos/seed/config-error/512/512` };
  }

  try {
    const body = { prompt, options };
    const response = await fetchWithRetry(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    const validation = N8NResponseSchema.safeParse(data);
    if (!validation.success) {
      console.error("n8n response validation error:", validation.error);
      throw new Error("Received invalid data structure from n8n webhook.");
    }

    return validation.data;
  } catch (error) {
    console.error("Error in n8nClient:", error);
    // On failure, return a placeholder error image
    return { image_url: `https://picsum.photos/seed/error/512/512` };
  }
}
