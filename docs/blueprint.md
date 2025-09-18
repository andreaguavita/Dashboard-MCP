# **App Name**: AgentFlow

## Core Features:

- Image Generation via n8n: Accepts a prompt, sends it to an n8n webhook, and displays the generated image URL. A loading spinner indicates when the image is being generated, along with error handling.
- Smart Prompt Generation: Generates a series of prompt using an LLM, to allow users to find inspiration to create their images.
- Web Scraping via MCP: Accepts a URL, scrapes the content using a local proxy and Playwright MCP, and displays the title, links, and a summary of the text. Error and loading states implemented.

## Style Guidelines:

- Primary color: Vibrant blue (#29ABE2) to reflect intelligence and flow.
- Background color: Light blue (#E0F7FA) for a clean, airy feel.
- Accent color: Teal (#008080) for subtle emphasis and highlighting.
- Headline font: 'Space Grotesk' sans-serif for headlines; body font: 'Inter' sans-serif for body text.
- Use a responsive grid layout to accommodate different screen sizes, with agent cards arranged in a clear, accessible way.