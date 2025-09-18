// src/components/ScrapeAgentCard.tsx
'use client';

import React, { useState } from 'react';

type ScrapeResponse = {
  title: string;
  links: string[];
  textSummary: string;
};

export default function ScrapeAgentCard() {
  const [url, setUrl] = useState('');
  const [mobileView, setMobileView] = useState(false);
  const [pages, setPages] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!url) {
      setError('Ingresa una URL');
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || '/api'}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          maxDepth: 0,
          followLinks: pages > 1,   // si piden >1 página, habilitamos recorrer links
          mobile_view: mobileView,  // 🔽 nuevo
          pages,                    // 🔽 nuevo
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as ScrapeResponse;
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Error realizando scraping');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="text-lg font-semibold">Scraping Agent (MCP)</h3>

      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm mb-1">URL a analizar</label>
          <input
            type="url"
            placeholder="https://multiplica.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="mobile"
            type="checkbox"
            checked={mobileView}
            onChange={(e) => setMobileView(e.target.checked)}
          />
          <label htmlFor="mobile" className="text-sm">Analizar versión móvil</label>
        </div>

        <div>
          <label className="block text-sm mb-1">Páginas a scrapear (1–10)</label>
          <input
            type="number"
            min={1}
            max={10}
            value={pages}
            onChange={(e) => setPages(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            className="w-32 rounded-md border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {loading ? 'Analizando…' : 'Scrapear'}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {result && (
        <div className="mt-3 space-y-2">
          <div><span className="font-medium">Título:</span> {result.title}</div>
          <div>
            <span className="font-medium">Links ({result.links.length}):</span>
            <ul className="list-disc pl-5 text-sm">
              {result.links.slice(0, 10).map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
          <div>
            <span className="font-medium">Resumen:</span>
            <p className="text-sm whitespace-pre-wrap">{result.textSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
