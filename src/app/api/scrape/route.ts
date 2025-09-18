// src/app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ENV } from '@/lib/env';

export const runtime = 'nodejs';        // Asegura runtime Node (no Edge)
export const dynamic = 'force-dynamic'; // Evita caché agresiva en App Router

// CORS básico para pruebas (en prod, restringe el origen)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Validación del body
const ScrapeRequestSchema = z.object({
  url: z.string().url({ message: 'Please provide a valid URL.' }),
  maxDepth: z.number().int().min(0).max(2).optional().default(0),
  followLinks: z.boolean().optional().default(false),
});

// Validación mínima de la respuesta del proxy
const ProxyResponseSchema = z.object({
  title: z.string().optional(),
  links: z.array(z.string().url()).optional().default([]),
  textSummary: z.string().optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const mcpBase =
    ENV?.MCP_PROXY_BASE?.trim() || process.env.MCP_PROXY_BASE?.trim();

  if (!mcpBase) {
    console.error('[API /scrape] MCP_PROXY_BASE is not configured.');
    return NextResponse.json(
      { error: 'Scraping service is not configured on the server.' },
      { status: 500, headers: corsHeaders },
    );
  }

  try {
    // 1) Parseo + validación del payload
    const json = await req.json().catch(() => ({}));
    const parsed = ScrapeRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400, headers: corsHeaders },
      );
    }
    const { url, maxDepth, followLinks } = parsed.data;
    console.log(`[API /scrape] Proxying request → ${url}`);

    // 2) Forward al MCP Proxy con timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30s

    const resp = await fetch(`${mcpBase}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, maxDepth, followLinks }),
      signal: controller.signal,
    }).catch((err) => {
      throw new Error(`Cannot reach MCP proxy: ${err.message}`);
    });
    clearTimeout(timeout);

    // 3) Manejo de errores del proxy
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      let errMsg = text;
      try {
        const json = JSON.parse(text);
        errMsg = json?.error || json?.message || text || resp.statusText;
      } catch {
        /* ignore JSON parse error */
      }
      return NextResponse.json(
        { error: `MCP proxy responded ${resp.status}: ${errMsg || 'Unknown error'}` },
        { status: 502, headers: corsHeaders },
      );
    }

    // 4) Validación/normalización de respuesta
    const dataRaw = await resp.json().catch(() => ({}));
    const data = ProxyResponseSchema.parse(dataRaw);

    const normalized = {
      title: data.title || 'No title found',
      links: data.links || [],
      textSummary: data.textSummary || 'No summary available.',
    };

    return NextResponse.json(normalized, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout communicating with MCP proxy (30s).' },
        { status: 504, headers: corsHeaders },
      );
    }
    const message = err?.message || 'Unexpected error in /api/scrape.';
    console.error('[API /scrape] Error:', message);
    return NextResponse.json(
      { error: 'Failed to scrape the URL.', details: message },
      { status: 500, headers: corsHeaders },
    );
  }
}
