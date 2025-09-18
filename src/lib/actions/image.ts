'use server';

import {z} from 'zod';
import {generatePrompt} from '@/ai/flows/generate-prompt';
import {generateImage as callN8n} from '@/lib/services/n8nClient';
import type {ActionState, N8NImageResult} from '@/lib/definitions';

const ImagePromptSchema = z.object({
  prompt: z
    .string()
    .min(3, 'Prompt must be at least 3 characters long.')
    .max(1000, 'Prompt must be 1000 characters or less.'),
});

export async function generateImageAction(
  prevState: ActionState<N8NImageResult>,
  formData: FormData
): Promise<ActionState<N8NImageResult>> {
  const validatedFields = ImagePromptSchema.safeParse({
    prompt: formData.get('prompt'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid prompt.',
      error: true,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await callN8n(validatedFields.data.prompt);
    if (!result.src) {
      throw new Error('The image generation service failed to return an image.');
    }
    return {
      message: 'Image generated successfully!',
      data: {
        imageUrl: result.src,
        image_name: result.name,
      },
      error: false,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      message: `Failed to generate image: ${errorMessage}`,
      error: true,
    };
  }
}

const SmartPromptTopicSchema = z.object({
  topic: z
    .string()
    .min(2, 'Topic must be at least 2 characters long.')
    .max(100, 'Topic must be 100 characters or less.'),
});

export async function generateSmartPromptsAction(
  prevState: ActionState<string[]>,
  formData: FormData
): Promise<ActionState<string[]>> {
  const validatedFields = SmartPromptTopicSchema.safeParse({
    topic: formData.get('topic'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid topic.',
      error: true,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generatePrompt({topic: validatedFields.data.topic});
    return {
      message: 'Prompts generated!',
      data: result.prompts,
      error: false,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      message: `Failed to generate prompts: ${errorMessage}`,
      error: true,
    };
  }
}
