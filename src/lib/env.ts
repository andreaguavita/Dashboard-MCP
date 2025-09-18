// This file centralizes environment variable access for clarity.

// Using NEXT_PUBLIC_ for client-side vars is a requirement.
// Server-only vars can be accessed directly via process.env.
export const ENV = {
  N8N_WEBHOOK_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '',
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || '',
  MCP_PROXY_BASE: process.env.MCP_PROXY_BASE || ''
};
