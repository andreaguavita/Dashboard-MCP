# AgentFlow Dashboard

Welcome to AgentFlow, a dashboard for managing AI agents and flows, built with Next.js and deployed on Firebase.

This v1 prototype includes two primary agents:
1.  **Image Agent**: Generates images from a text prompt via an n8n webhook.
2.  **Scraping Agent**: Scrapes web pages for content using a Playwright MCP-ready architecture.

## Getting Started

Follow these steps to get the project running locally.

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   Firebase account (for deployment)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd agent-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of the project by copying the example file:

```bash
cp .env.example .env.local
```

Now, open `.env.local` and fill in the required values:

-   `N8N_WEBHOOK_URL`: The full URL of your n8n webhook for image generation. The webhook should accept a POST request with a JSON body like `{"prompt": "your prompt"}` and return `{"image_url": "..."}`.
-   `MCP_SERVER_URL`: (Optional) The WebSocket URL for your Playwright MCP server. The current version uses a mock client, but this is where you would point to a real server.

### 4. Run the Development Server

This application uses Next.js, which runs both the frontend and the API proxy (`/api/scrape`) in a single command.

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## Project Architecture

This project is built with the Next.js App Router, prioritizing Server Components and Server Actions for performance and security.

-   **`/src/app`**: Contains the main application routes.
    -   `page.tsx`: The main dashboard UI.
    -   `layout.tsx`: The root layout, including font setup and global components like the `Toaster`.
    -   `api/scrape/route.ts`: A Next.js Route Handler that acts as a proxy for the scraping agent. It receives requests from the client and invokes the MCP client on the server.
-   **`/src/components`**: Reusable React components.
    -   `Header.tsx`: The main application header.
    -   `AgentCard.tsx`: A generic wrapper for agent cards to ensure consistent styling.
    -   `ImageAgentCard.tsx`: The UI for the image generation agent. It uses a Server Action to communicate with the backend.
    -   `ScrapeAgentCard.tsx`: The UI for the web scraping agent. It communicates with the `/api/scrape` proxy.
-   **`/src/lib`**: Contains business logic, type definitions, and client-side utilities.
    -   `actions/`: Server-side functions (Server Actions) that can be called directly from client components.
    -   `services/`: Clients for interacting with external (n8n) or internal (MCP) services.
    -   `definitions.ts`: Shared TypeScript types and interfaces.
-   **`/public`**: Static assets.

## Deployment to Firebase

This project is configured for deployment on **Firebase App Hosting**.

### Initial Firebase Setup

1.  Install the Firebase CLI: `npm install -g firebase-tools`
2.  Login to Firebase: `firebase login`
3.  Initialize Firebase in your project. **Important**: Select **App Hosting** when prompted.
    ```bash
    firebase init hosting
    ```
4.  Follow the prompts to connect your GitHub repository for CI/CD. This will automatically build and deploy your app on pushes to the `main` branch and create preview channels for pull requests.

### Environment Variables on Firebase

You will need to set your `N8N_WEBHOOK_URL` as a secret in Firebase App Hosting so the deployed application can access it.

```bash
firebase apphosting:secrets:set N8N_WEBHOOK_URL
```

You will be prompted to enter the secret value. After setting it, you must update your backend to grant it access to the secret.

**Note on `firebase.json`**: The `firebase.json` file in this repository is a placeholder as requested in the project brief. For Firebase App Hosting with Next.js, all configuration is handled by `apphosting.yaml` and your Next.js configuration. The `firebase.json` provided is more typical for older SPA-style hosting with Cloud Functions and is not actively used in this setup.
