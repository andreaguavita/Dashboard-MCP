'use client';

import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
  Globe,
  Link as LinkIcon,
  Loader2,
  Search,
  FileText,
} from 'lucide-react';
import {AgentCard} from './AgentCard';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {useToast} from '@/hooks/use-toast';
import {scrape} from '@/lib/services/scrapeClient';
import type {ScrapeResult} from '@/lib/definitions';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from './ui/form';
import {ScrollArea} from './ui/scroll-area';
import {Badge} from './ui/badge';

const FormSchema = z.object({
  url: z.string().url({
    message: 'Please enter a valid URL.',
  }),
});

function ScrapeButton({isLoading}: {isLoading: boolean}) {
  return (
    <Button
      type="submit"
      disabled={isLoading}
      aria-disabled={isLoading}
      aria-live="polite"
    >
      {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
      <span className="ml-2">{isLoading ? 'Scraping...' : 'Scrape'}</span>
    </Button>
  );
}

export function ScrapeAgentCard() {
  const {toast} = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapeData, setScrapeData] = useState<ScrapeResult | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      url: 'https://example.com',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setError(null);
    setScrapeData(null);

    try {
      const result = await scrape(data.url);
      setScrapeData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Scraping Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AgentCard
      title="Scraping Agent (MCP)"
      description="Scrape a web page to extract its title, links, and a text summary."
      icon={Globe}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({field}) => (
              <FormItem>
                <Label htmlFor="url">URL to Scrape</Label>
                <div className="flex gap-2 mt-1">
                  <FormControl>
                    <Input
                      id="url"
                      placeholder="https://example.com"
                      {...field}
                    />
                  </FormControl>
                  <ScrapeButton isLoading={isLoading} />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <div
        className="mt-6 flex-grow flex flex-col min-h-0"
        aria-live="polite"
        aria-busy={isLoading}
      >
        {(isLoading || scrapeData || error) && (
          <>
            <h3 className="font-headline text-lg mb-3">Results</h3>
            <div className="p-4 border rounded-lg bg-secondary/30 flex-grow min-h-0">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-4">Scraping page content...</p>
                </div>
              )}
              {error && (
                <div className="text-destructive text-center h-full flex flex-col justify-center">
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {scrapeData && (
                <div className="space-y-4 h-full flex flex-col">
                  <h4 className="font-bold text-primary text-lg font-headline break-words">
                    {scrapeData.title}
                  </h4>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 mt-1 text-accent shrink-0" />
                    <div>
                      <h5 className="font-semibold mb-1">Summary</h5>
                      <p className="text-sm text-muted-foreground">
                        {scrapeData.textSummary}
                      </p>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col min-h-0">
                    <div className="flex items-center gap-3 mb-2">
                      <LinkIcon className="h-5 w-5 text-accent shrink-0" />
                      <h5 className="font-semibold">
                        Found Links{' '}
                        <Badge variant="secondary">
                          {scrapeData.links.length}
                        </Badge>
                      </h5>
                    </div>
                    <ScrollArea className="flex-grow pr-3">
                      <ul className="space-y-2">
                        {scrapeData.links.map((link, index) => (
                          <li key={index}>
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline truncate block"
                              title={link.href}
                            >
                              {link.text || link.href}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AgentCard>
  );
}
