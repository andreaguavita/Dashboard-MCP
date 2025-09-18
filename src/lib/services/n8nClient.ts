import {z} from 'zod';
import {ENV} from '@/lib/env';

// Schema for the expected n8n webhook response
const N8NResponseSchema = z.object({
  imageUrl: z.string(),
  mime_type: z.string().optional().default('image/png'),
  image_name: z.string().optional().default('Generated Image'),
  meta: z.object({}).catchall(z.any()).optional(),
});

/**
 * Generates an image by calling the n8n webhook.
 * @param prompt The text prompt for image generation.
 * @returns A promise that resolves to an object containing the Data URL source and the image name.
 */
export async function generateImage(
  prompt: string
): Promise<{src: string; name: string}> {
  const {N8N_WEBHOOK_URL} = ENV;
  if (!N8N_WEBHOOK_URL) {
    throw new Error(
      'N8N_WEBHOOK_URL is not configured in environment variables.'
    );
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({prompt}),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `n8n webhook failed with status ${response.status}: ${
          errorBody.message || 'Unknown error'
        }`
      );
    }

    const data = await response.json();
    console.log('[n8nClient] meta:', data.meta); // For debug purposes

    const validation = N8NResponseSchema.safeParse(data);
    if (!validation.success) {
      console.error('n8n response validation error:', validation.error);
      throw new Error('Received invalid data structure from n8n webhook.');
    }

    const {
      imageUrl: base64Image,
      mime_type: mimeType,
      image_name: imageName,
    } = validation.data;

    // Ensure imageUrl is not empty and remove any whitespace/newlines
    const cleanedBase64 = (base64Image || '').toString().replace(/\s/g, '');
    if (!cleanedBase64) {
      throw new Error('imageUrl field in n8n response is empty.');
    }

    // Construct the Data URL
    const src = `data:${mimeType};base64,${cleanedBase64}`;

    return {
      src: src,
      name: imageName,
    };
  } catch (error) {
    console.error('Error in n8nClient:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(errorMessage);
  }
}
