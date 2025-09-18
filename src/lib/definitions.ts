export type ScrapeResult = {
  title: string;
  links: { href: string; text: string }[];
  textSummary: string;
  raw?: { snapshot?: object };
};

export type ActionState<T = any> = {
  message: string;
  data?: T;
  error?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
};
