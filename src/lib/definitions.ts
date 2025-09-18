export type ScrapeResult = {
  title: string;
  links: { href: string; text: string }[];
  textSummary: string;
  raw?: { snapshot?: object };
};

export type N8NImageResult = {
  image_url: string;
  metadata?: {
    jobId?: string;
    duration_ms?: number;
  };
};

export type ActionState<T = any> = {
  message: string;
  data?: T;
  error?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
};
