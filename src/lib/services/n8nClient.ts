import { z } from "zod";
import { N8N_WEBHOOK_URL } from "@/lib/env";
import type { N8NImageResult } from "@/lib/definitions";

const N8NResponseSchema = z.object({
  imageUrl: z.string(),
  mime_type: z.string().optional(),
  image_name: z.string().optional(),
  meta: z
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
    return { error: 'N8N_WEBHOOK_URL is not configured correctly.' };
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
    
    if (validation.data.meta) {
        console.log("n8n metadata:", validation.data.meta);
    }
    
    const mimeType = validation.data.mime_type || 'image/png';
    
    return {
      imageUrl: `data:${mimeType};base64,${validation.data.imageUrl}`,
      image_name: validation.data.image_name,
    };
  } catch (error) {
    console.error("Error in n8nClient:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { error: errorMessage };
  }
}