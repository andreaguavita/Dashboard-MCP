// src/app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ENV } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ScrapeRequestSchema = z.object({
  url: z.string().url({ message: 'Please provide a valid URL.' }),
  maxDepth: z.number().int().min(0).max(2).optional().default(0),
  followLinks: z.boolean().optional().default(false),
  // 🔽 nuevos:
  mobile_view: z.boolean().optional().default(false),
  pages: z.number().int().min(1).max(10).optional().default(1), // p.ej. 1–10
});

const ProxyResponseSchema = z.object({
  title: z.string().optional(),
  links: z.array(z.string()).optional().default([]),
  textSummary: z.string().optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const mcpBase = ENV?.MCP_PROXY_BASE?.trim() || process.env.MCP_PROXY_BASE?.trim();
  if (!mcpBase) {
    return NextResponse.json(
      { error: 'Scraping service is not configured on the server.' },
      { status: 500, headers: corsHeaders },
    );
  }

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = ScrapeRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body.', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: corsHeaders },
      );
    }

    const payload = parsed.data;

    // timeout de 30s
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 30_000);

    const resp = await fetch(`${mcpBase}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).catch((err) => {
      throw new Error(`Cannot reach MCP proxy: ${err.message}`);
    });
    clearTimeout(t);

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return NextResponse.json(
        { error: `MCP proxy responded ${resp.status}: ${text || resp.statusText}` },
        { status: 502, headers: corsHeaders },
      );
    }

    const dataRaw = await resp.json().catch(() => ({}));
    const data = ProxyResponseSchema.parse(dataRaw);
    return NextResponse.json(
      {
        title: data.title || 'No title found',
        links: data.links || [],
        textSummary: data.textSummary || 'No summary available.',
      },
      { status: 200, headers: corsHeaders },
    );
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout communicating with MCP proxy (30s).' },
        { status: 504, headers: corsHeaders },
      );
    }
    return NextResponse.json(
      { error: 'Failed to scrape the URL.', details: err?.message || 'Unexpected error' },
      { status: 500, headers: corsHeaders },
    );
  }
}
