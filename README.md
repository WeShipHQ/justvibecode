This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Gemini API Key (required for AI chat)
# Get your API key from: https://ai.google.dev/
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
# or
# GEMINI_API_KEY=your_gemini_api_key_here

# Vercel OIDC Token (required for Vercel Sandbox)
# For local development, you need to:
# 1. Install Vercel CLI: npm i -g vercel
# 2. Link your project: vercel link
# 3. Pull environment variables: vercel env pull
# This will automatically create .env.local with VERCEL_OIDC_TOKEN
# Note: OIDC token expires after 12 hours, run `vercel env pull` to refresh
VERCEL_OIDC_TOKEN=your_vercel_oidc_token_here
```

### Setup Vercel Sandbox

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   ```

2. **Link your project to Vercel**:

   ```bash
   vercel link
   ```

   This will prompt you to:
   - Select or create a Vercel project
   - Link your local project to the Vercel project

3. **Pull environment variables**:
   ```bash
   vercel env pull
   ```
   This will create/update `.env.local` with `VERCEL_OIDC_TOKEN` and other environment variables.

**Note**: The OIDC token expires after 12 hours. If you see "Failed to create sandbox" errors, run `vercel env pull` again to refresh the token.

### Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# justvibecode
