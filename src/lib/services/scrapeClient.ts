"use client";

import { z } from 'zod';
import type { ScrapeResult } from '@/lib/definitions';

const ScrapeResponseSchema = z.object({
  title: z.string(),
  links: z.array(z.object({
    href: z.string(),
    text: z.string(),
  })),
  textSummary: z.string(),
});

/**
 * Calls the internal scraping API proxy.
 * This function is intended to be used on the client-side.
 * @param url The URL to scrape.
 * @returns A promise that resolves to the scraped data.
 */
export async function scrape(url: string): Promise<ScrapeResult> {
  try {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      throw new Error(responseBody.error || `HTTP error! status: ${response.status}`);
    }
    
    const validation = ScrapeResponseSchema.safeParse(responseBody);
    if (!validation.success) {
      console.error("Scrape API response validation error:", validation.error);
      throw new Error("Received invalid data from scraping service.");
    }
    
    return validation.data;
  } catch (error) {
    console.error("Error in scrapeClient:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred during scraping.");
  }
}
