// This file centralizes environment variable access for clarity.

// For server-side environment variables.
// Access these directly via `process.env` in server-side code (Server Components, API Routes, Server Actions).
export const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
export const MCP_SERVER_URL = process.env.MCP_SERVER_URL;

// For client-side environment variables.
// These MUST be prefixed with NEXT_PUBLIC_ in your .env file.
// Example:
// export const NEXT_PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE;
