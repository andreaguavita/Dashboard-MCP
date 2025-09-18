import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mcpClient } from '@/lib/services/mcpClient';

const scrapeRequestSchema = z.object({
  url: z.string().url({ message: "Please provide a valid URL." }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = scrapeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body.", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { url } = validation.data;
    
    console.log(`[API /scrape] Received request for URL: ${url}`);

    // In a real application, you might add more robust input sanitization
    // and checks (e.g., against a DNS blocklist) here.

    const data = await mcpClient.scrape(url);

    return NextResponse.json(data);

  } catch (error) {
    console.error('[API /scrape] Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to scrape the URL.", details: errorMessage }, { status: 500 });
  }
}
