import {NextResponse} from 'next/server';
import {z} from 'zod';
import {ENV} from '@/lib/env';

const scrapeRequestSchema = z.object({
  url: z.string().url({message: 'Please provide a valid URL.'}),
});

// Basic CORS headers - adjust as needed for production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {headers: corsHeaders});
}

export async function POST(request: Request) {
  const {MCP_PROXY_BASE} = ENV;
  if (!MCP_PROXY_BASE) {
    console.error('[API /scrape] MCP_PROXY_BASE is not configured.');
    return NextResponse.json(
      {error: 'Scraping service is not configured on the server.'},
      {status: 500, headers: corsHeaders}
    );
  }

  try {
    const body = await request.json();
    const validation = scrapeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body.',
          details: validation.error.flatten().fieldErrors,
        },
        {status: 400, headers: corsHeaders}
      );
    }

    const {url} = validation.data;
    console.log(`[API /scrape] Proxying request for URL: ${url}`);

    // Forward the request to the MCP proxy
    const mcpResponse = await fetch(`${MCP_PROXY_BASE}/api/scrape`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        url,
        maxDepth: 0,
        followLinks: false,
      }),
    });

    if (!mcpResponse.ok) {
      const errorBody = await mcpResponse.json().catch(() => ({}));
      throw new Error(
        `MCP proxy failed with status ${mcpResponse.status}: ${
          errorBody.message || 'Unknown error'
        }`
      );
    }

    const data = await mcpResponse.json();

    // The current mock mcpClient returns the correct shape, but a real proxy might not.
    // It's good practice to normalize or validate the response from the downstream service.
    const normalizedData = {
      title: data.title || 'No title found',
      links: data.links || [],
      textSummary: data.textSummary || 'No summary available.',
    };

    return NextResponse.json(normalizedData, {headers: corsHeaders});
  } catch (error) {
    console.error('[API /scrape] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      {error: 'Failed to scrape the URL.', details: errorMessage},
      {status: 500, headers: corsHeaders}
    );
  }
}
